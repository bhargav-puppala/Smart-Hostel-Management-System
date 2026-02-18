const Hostel = require('../hostels/hostel.model');
const Room = require('../rooms/room.model');
const User = require('../users/user.model');
const Fee = require('../fees/fee.model');
const Complaint = require('../complaints/complaint.model');
const Allotment = require('../allotments/allotment.model');
const ApiResponse = require('../../shared/utils/ApiResponse');

const getStats = async (req, res, next) => {
  try {
    const [hostelCount, roomCount, studentCount, feeStats, complaintStats, allotmentCount] = await Promise.all([
      Hostel.countDocuments(),
      Room.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Fee.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]),
      Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Allotment.countDocuments({ endDate: null }),
    ]);

    const feesByStatus = Object.fromEntries(feeStats.map((s) => [s._id, { count: s.count, total: s.total }]));
    const complaintsByStatus = Object.fromEntries(complaintStats.map((c) => [c._id, c.count]));

    const totalRevenue = feeStats.filter((s) => s._id === 'paid').reduce((sum, s) => sum + (s.total || 0), 0);
    const pendingFees = feesByStatus.pending?.count || 0;
    const overdueFees = feesByStatus.overdue?.count || 0;
    const openComplaints = (complaintsByStatus.open || 0) + (complaintsByStatus.in_progress || 0);

    const occupancyRate = roomCount > 0 ? Math.round((allotmentCount / roomCount) * 100) : 0;

    const stats = {
      hostels: hostelCount,
      rooms: roomCount,
      students: studentCount,
      occupancyRate,
      activeAllotments: allotmentCount,
      totalRevenue,
      pendingFees,
      overdueFees,
      paidFees: feesByStatus.paid?.count || 0,
      openComplaints,
      resolvedComplaints: complaintsByStatus.resolved || 0,
      closedComplaints: complaintsByStatus.closed || 0,
    };

    return ApiResponse.success(res, stats);
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
