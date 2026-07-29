const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authenticateToken } = require('../auth');

// GET /api/dashboard - Get real-time dashboard analytics & metrics
router.get('/', authenticateToken, (req, res) => {
  const { date, employee, eligibility, contactStatus, offerResult } = req.query;

  // Master stats
  const totalMaster = db.prepare('SELECT COUNT(*) as count FROM master_customers').get().count;

  // Daily stats for today or filtered date
  const targetDate = date || new Date().toISOString().split('T')[0];

  const todayDailyStats = db.prepare(`
    SELECT 
      SUM(total_rows) as total_uploaded_today,
      SUM(eligible_rows) as eligible_today,
      SUM(ineligible_rows) as not_eligible_today,
      SUM(duplicate_rows) as duplicates_today,
      SUM(invalid_rows) as missing_today
    FROM daily_uploads
    WHERE DATE(upload_date) = DATE(?) AND status = 'completed'
  `).get(targetDate);

  // Manual override count
  const manualOverridesCount = db.prepare('SELECT COUNT(*) as count FROM master_customers WHERE manual_override IS NOT NULL').get().count;

  // Contact status metrics
  let callWhere = [];
  let params = [];

  if (employee) {
    callWhere.push('contacted_by = ?');
    params.push(employee);
  }
  if (eligibility) {
    callWhere.push("(CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) = ?");
    params.push(eligibility);
  }
  if (contactStatus) {
    callWhere.push('contact_status = ?');
    params.push(contactStatus);
  }
  if (offerResult) {
    callWhere.push('offer_result = ?');
    params.push(offerResult);
  }

  const callWhereSql = callWhere.length > 0 ? `WHERE ${callWhere.join(' AND ')}` : '';

  const customerMetrics = db.prepare(`
    SELECT 
      SUM(CASE WHEN contact_status != 'Not called' THEN 1 ELSE 0 END) as already_contacted,
      SUM(CASE WHEN contact_status = 'Not called' AND (CASE WHEN manual_override IS NOT NULL THEN manual_override ELSE offer_eligibility END) = 'Yes' THEN 1 ELSE 0 END) as not_yet_called,
      SUM(CASE WHEN DATE(contact_date) = DATE(?) THEN 1 ELSE 0 END) as calls_completed_today,
      SUM(CASE WHEN contact_status = 'Interested' THEN 1 ELSE 0 END) as interested_customers,
      SUM(CASE WHEN contact_status = 'Accepted offer' OR offer_result = 'Accepted' THEN 1 ELSE 0 END) as accepted_offers,
      SUM(CASE WHEN contact_status = 'Declined offer' OR offer_result = 'Declined' THEN 1 ELSE 0 END) as declined_offers,
      SUM(CASE WHEN contact_status = 'No answer' THEN 1 ELSE 0 END) as no_answer_calls,
      SUM(CASE WHEN follow_up_date IS NOT NULL AND DATE(follow_up_date) <= DATE('now') THEN 1 ELSE 0 END) as followups_due_today
    FROM master_customers
    ${callWhereSql}
  `).get(targetDate, ...params);

  res.json({
    date: targetDate,
    master: {
      totalRecords: totalMaster,
      manuallyOverridden: manualOverridesCount
    },
    todayUploads: {
      uploadedToday: todayDailyStats.total_uploaded_today || 0,
      eligibleToday: todayDailyStats.eligible_today || 0,
      notEligibleToday: todayDailyStats.not_eligible_today || 0,
      duplicateUsernames: todayDailyStats.duplicates_today || 0,
      missingUsernames: todayDailyStats.missing_today || 0
    },
    calling: {
      alreadyContacted: customerMetrics.already_contacted || 0,
      notYetCalled: customerMetrics.not_yet_called || 0,
      callsCompletedToday: customerMetrics.calls_completed_today || 0,
      interestedCustomers: customerMetrics.interested_customers || 0,
      acceptedOffers: customerMetrics.accepted_offers || 0,
      declinedOffers: customerMetrics.declined_offers || 0,
      noAnswerCalls: customerMetrics.no_answer_calls || 0,
      followupsDueToday: customerMetrics.followups_due_today || 0
    }
  });
});

module.exports = router;
