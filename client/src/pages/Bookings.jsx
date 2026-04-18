import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingsApi, paymentsApi, uploadApi } from '../services/api';

const badgeClass = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-rose-100 text-rose-700',
  occupied: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-emerald-100 text-emerald-700',
  available: 'bg-emerald-100 text-emerald-700',
  reserved: 'bg-blue-100 text-blue-700',
  occupiedBed: 'bg-slate-200 text-slate-700',
};

const toCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

export default function Bookings() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedBed, setSelectedBed] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [bookingForm, setBookingForm] = useState({ roomId: '', bedNumber: '', details: '', amount: '5000' });
  const [paymentForm, setPaymentForm] = useState({ method: 'upi', transactionRef: '', proofUrl: '' });

  const load = async () => {
    setLoading(true);
    try {
      const bookingParams = { page, limit: 10 };
      const paymentParams = { page: paymentPage, limit: 10 };

      const requests = [bookingsApi.getAll(bookingParams), paymentsApi.getAll(paymentParams), bookingsApi.getAvailableRooms()];
      const [bookingRes, paymentRes, roomRes] = await Promise.all(requests);

      setBookings(bookingRes.data.data || []);
      setTotalPages(bookingRes.data.pagination?.totalPages || 1);
      setPayments(paymentRes.data.data || []);
      setPaymentTotalPages(paymentRes.data.pagination?.totalPages || 1);
      setRooms(roomRes.data.data || []);
    } catch {
      setBookings([]);
      setPayments([]);
      setRooms([]);
      setTotalPages(1);
      setPaymentTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, paymentPage, user?.role]);

  const openBookingModal = (room, bedNumber) => {
    setSelectedRoom(room);
    setSelectedBed(bedNumber);
    setBookingForm({
      roomId: room._id,
      bedNumber: String(bedNumber),
      details: '',
      amount: room.amount || '5000',
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (event) => {
    event.preventDefault();
    try {
      await bookingsApi.create({
        ...bookingForm,
        amount: Number(bookingForm.amount) || 5000,
      });
      setSuccessMessage('Booking request submitted successfully.');
      setShowBookingModal(false);
      setSelectedRoom(null);
      setSelectedBed(null);
      setBookingForm({ roomId: '', bedNumber: '', details: '', amount: '5000' });
      load();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit booking request');
    }
  };

  const handleApprove = async (bookingId) => {
    try {
      await bookingsApi.approve(bookingId);
      setSuccessMessage('Booking approved successfully.');
      load();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve booking');
    }
  };

  const handleReject = async (event) => {
    event.preventDefault();
    if (!selectedBooking) return;
    try {
      await bookingsApi.reject(selectedBooking._id, { rejectionReason });
      setSuccessMessage('Booking rejected successfully.');
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectionReason('');
      load();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject booking');
    }
  };

  const handlePaymentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const response = await uploadApi.upload(file);
      const url = response.data.data?.url;
      if (url) {
        setPaymentForm((current) => ({ ...current, proofUrl: url }));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    if (!selectedBooking) return;
    try {
      await bookingsApi.pay(selectedBooking._id, paymentForm);
      setSuccessMessage('Payment recorded successfully. Room is now occupied.');
      setShowPaymentModal(false);
      setSelectedBooking(null);
      setPaymentForm({ method: 'upi', transactionRef: '', proofUrl: '' });
      load();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const bookingSummary = bookings.reduce(
    (summary, booking) => {
      summary.total += 1;
      summary[booking.status] = (summary[booking.status] || 0) + 1;
      if (booking.paymentStatus === 'paid') summary.paid += 1;
      return summary;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0, occupied: 0, paid: 0 }
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <div className="flex items-center justify-between gap-3">
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage('')} className="text-emerald-700/80 hover:text-emerald-900">Dismiss</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Available Rooms</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{rooms.length}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Pending Requests</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{bookingSummary.pending}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Approved / Occupied</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{bookingSummary.approved + bookingSummary.occupied}</p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">Payments Paid</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{bookingSummary.paid}</p>
        </div>
      </div>

      {isStudent ? (
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Available Beds</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Select a bed, submit a booking request, then wait for approval.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <article key={room._id} className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{room.hostelId?.name || 'Hostel'}</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Room {room.roomNumber}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${badgeClass[room.status] || 'bg-slate-100 text-slate-700'}`}>
                        {room.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Capacity {room.capacity} | Available {room.availableBeds?.length || 0} | Reserved {room.reservedBeds?.length || 0} | Occupied {room.occupiedBeds?.length || 0}</p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {room.beds?.map((bed) => {
                        const isAvailable = bed.status === 'available';
                        return (
                          <button
                            key={`${room._id}-${bed.bedNumber}`}
                            type="button"
                            onClick={() => isAvailable && openBookingModal(room, bed.bedNumber)}
                            disabled={!isAvailable}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                              bed.status === 'occupied'
                                ? 'bg-slate-200 text-slate-600 cursor-not-allowed'
                                : bed.status === 'reserved'
                                  ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                          >
                            Bed {bed.bedNumber}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const firstFreeBed = room.availableBeds?.[0];
                        if (firstFreeBed) openBookingModal(room, firstFreeBed);
                      }}
                      disabled={!room.availableBeds?.length}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white font-semibold shadow-lg shadow-emerald-500/20"
                    >
                      Request Bed
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">My Requests</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">{bookings.length}</span>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {bookings.map((booking) => (
                  <div key={booking._id} className="px-5 py-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Room {booking.roomId?.roomNumber} · Bed {booking.bedNumber}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{booking.roomId?.hostelId?.name || 'Hostel'}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeClass[booking.status] || 'bg-slate-100 text-slate-700'}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{booking.details}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400">{toCurrency(booking.amount)}</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeClass[booking.paymentStatus] || 'bg-slate-100 text-slate-700'}`}>
                        {booking.paymentStatus}
                      </span>
                    </div>
                    {booking.status === 'approved' && booking.paymentStatus === 'unpaid' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setPaymentForm({ method: 'upi', transactionRef: '', proofUrl: '' });
                          setShowPaymentModal(true);
                        }}
                        className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Pay now
                      </button>
                    )}
                  </div>
                ))}
                {bookings.length === 0 && (
                  <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No booking requests yet</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Payments</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">{payments.length}</span>
              </div>
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment._id} className="px-5 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{payment.roomId?.roomNumber} · Bed {payment.bedNumber}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{payment.method || 'upi'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeClass[payment.status] || 'bg-slate-100 text-slate-700'}`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
                {payments.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No payments yet</div>}
              </div>
            </div>
          </aside>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
          <section className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">Booking Requests</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Approve a request to create the payment record, then mark payment to occupy the bed.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Room / Bed</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Payment</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{booking.studentId?.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{booking.studentId?.email}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                        <p className="font-medium">{booking.roomId?.roomNumber}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Bed {booking.bedNumber} · {toCurrency(booking.amount)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeClass[booking.status] || 'bg-slate-100 text-slate-700'}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeClass[booking.paymentStatus] || 'bg-slate-100 text-slate-700'}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-3">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(booking._id)}
                              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setRejectionReason('');
                                setShowRejectModal(true);
                              }}
                              className="text-sm font-semibold text-rose-600 hover:text-rose-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {booking.status === 'approved' && booking.paymentStatus === 'unpaid' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setPaymentForm({ method: 'upi', transactionRef: '', proofUrl: '' });
                              setShowPaymentModal(true);
                            }}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Track Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                        No booking requests yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm"
                >
                  Prev
                </button>
                <span className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400">{page} / {totalPages}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </section>

          <aside className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Payments</h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">{payments.length}</span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {payments.map((payment) => (
                <div key={payment._id} className="px-5 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{payment.studentId?.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Room {payment.roomId?.roomNumber} · Bed {payment.bedNumber}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${badgeClass[payment.status] || 'bg-slate-100 text-slate-700'}`}>
                      {payment.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{toCurrency(payment.amount)}</p>
                  {payment.proofUrl && (
                    <a href={payment.proofUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                      View proof
                    </a>
                  )}
                </div>
              ))}
              {payments.length === 0 && <div className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No payment records yet</div>}
            </div>
            {paymentTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/20">
                <button
                  type="button"
                  disabled={paymentPage <= 1}
                  onClick={() => setPaymentPage((current) => current - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm"
                >
                  Prev
                </button>
                <span className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400">{paymentPage} / {paymentTotalPages}</span>
                <button
                  type="button"
                  disabled={paymentPage >= paymentTotalPages}
                  onClick={() => setPaymentPage((current) => current + 1)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Request Bed {selectedBed} in Room {selectedRoom.roomNumber}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedRoom.hostelId?.name || 'Hostel'} · {toCurrency(bookingForm.amount)}</p>
            <form onSubmit={handleBookingSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Details</label>
                <textarea
                  value={bookingForm.details}
                  onChange={(event) => setBookingForm((current) => ({ ...current, details: event.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-emerald-500"
                  placeholder="Add a short reason or any notes for the admin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Booking Amount</label>
                <input
                  type="number"
                  min="0"
                  value={bookingForm.amount}
                  onChange={(event) => setBookingForm((current) => ({ ...current, amount: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-emerald-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Record Payment</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Room {selectedBooking.roomId?.roomNumber} · Bed {selectedBooking.bedNumber}</p>
            <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Method</label>
                <select
                  value={paymentForm.method}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-emerald-500"
                >
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Transaction Reference</label>
                <input
                  value={paymentForm.transactionRef}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, transactionRef: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-emerald-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Upload Proof</label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:border-emerald-500">
                    <input type="file" accept="image/*" onChange={handlePaymentUpload} className="hidden" disabled={uploading} />
                    {uploading ? 'Uploading...' : paymentForm.proofUrl ? 'Change Proof' : 'Choose File'}
                  </label>
                  {paymentForm.proofUrl && <span className="text-xs text-slate-500 dark:text-slate-400 truncate">Uploaded</span>}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRejectModal && selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xl p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reject Booking</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedBooking.studentId?.name} · Room {selectedBooking.roomId?.roomNumber} · Bed {selectedBooking.bedNumber}</p>
            <form onSubmit={handleReject} className="space-y-4 mt-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-emerald-500"
                  placeholder="Explain why the request was rejected"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-3 font-semibold text-white shadow-lg shadow-rose-500/20"
                >
                  Reject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
