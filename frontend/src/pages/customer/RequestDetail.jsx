import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import PaymentModal from '../../components/PaymentModal';
import { CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

// TZS formatter
const tzs = (v) => `TZS ${Number(v).toLocaleString('en-TZ')}`;

export default function RequestDetail() {
  const { id } = useParams();
  const [request, setRequest]   = useState(null);
  const [payment, setPayment]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [showPayment, setShowPay] = useState(false);
  const [review, setReview]     = useState({ rating: 5, comment: '' });
  const [subReview, setSubRev]  = useState(false);

  const fetchAll = () => {
    Promise.all([
      api.get(`/user/requests/${id}`),
      api.get(`/payments/request/${id}`).catch(() => ({ data: { payment: null } })),
    ]).then(([reqRes, payRes]) => {
      setRequest(reqRes.data.request);
      setPayment(payRes.data.payment);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    setSubRev(true);
    try {
      await api.post(`/user/requests/${id}/review`, review);
      toast.success('Review submitted!');
      const { data } = await api.get(`/user/requests/${id}`);
      setRequest(data.request);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to submit review'); }
    finally { setSubRev(false); }
  };

  if (loading) return <LoadingSpinner text="Loading request details..." />;
  if (!request) return <div className="text-center py-20 text-slate-500">Request not found.</div>;

  const tech        = request.technician?.user;
  const isCompleted = request.status === 'completed';
  const hasCost     = request.finalCost && parseFloat(request.finalCost) > 0;
  const isPaid      = request.paymentStatus === 'paid' || payment?.status === 'succeeded';
  const isWaived    = request.paymentStatus === 'waived';
  const needsPay    = isCompleted && hasCost && !isPaid && !isWaived;

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in-up">
      <Link to="/dashboard/my-requests" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
        ← My Requests
      </Link>

      {/* Main card */}
      <div className="card-cyber p-6">
        <div className="flex flex-wrap justify-between items-start gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{request.title}</h1>
            <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">
              Ticket #{request.ticketNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </div>
        </div>

        <div className="space-y-2.5 text-sm">
          <div>
            <span className="font-medium text-slate-500 dark:text-slate-400">Service: </span>
            <span className="text-gray-800 dark:text-gray-200">{request.service?.name}</span>
          </div>
          <div>
            <span className="font-medium text-slate-500 dark:text-slate-400">Description:</span>
            <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap leading-relaxed">
              {request.description}
            </p>
          </div>
          {request.location && (
            <div>
              <span className="font-medium text-slate-500 dark:text-slate-400">Location: </span>
              <span className="text-gray-800 dark:text-gray-200">{request.location}</span>
            </div>
          )}
          {request.preferredDate && (
            <div>
              <span className="font-medium text-slate-500 dark:text-slate-400">Preferred: </span>
              <span className="text-gray-800 dark:text-gray-200">
                {new Date(request.preferredDate).toLocaleDateString()} {request.preferredTime}
              </span>
            </div>
          )}
          <div>
            <span className="font-medium text-slate-500 dark:text-slate-400">Submitted: </span>
            <span className="text-gray-800 dark:text-gray-200">{new Date(request.createdAt).toLocaleString()}</span>
          </div>
          {request.completedAt && (
            <div>
              <span className="font-medium text-slate-500 dark:text-slate-400">Completed: </span>
              <span className="text-gray-800 dark:text-gray-200">{new Date(request.completedAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Technician */}
      {tech && (
        <div className="card-cyber p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">👷 Assigned Technician</h2>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-green-700 dark:text-green-300">{tech.name?.[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{tech.name}</p>
              {tech.phone && <p className="text-sm text-slate-400">📞 {tech.phone}</p>}
            </div>
          </div>
          {request.technicianNotes && (
            <div className="mt-3 bg-blue-50/50 dark:bg-slate-700/40 p-3 rounded-xl text-sm">
              <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">Technician Notes:</p>
              <p className="text-slate-600 dark:text-slate-400">{request.technicianNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Payment section */}
      {isCompleted && hasCost && (
        <div className={`card-cyber p-5 ${
          isPaid   ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10' :
          isWaived ? '' :
          'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-blue-500" /> Payment
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Service Cost:{' '}
                <span className="font-black text-gray-900 dark:text-white text-base">
                  {tzs(request.finalCost)}
                </span>
              </p>
              <p className="text-sm">
                {isPaid   ? <span className="text-green-600 dark:text-green-400 font-semibold">✅ Paid</span>
                 : isWaived ? <span className="text-slate-500">Waived by admin</span>
                 : <span className="text-amber-600 dark:text-amber-400 font-semibold">⏳ Payment Required</span>}
              </p>
              {payment?.paidAt && (
                <p className="text-xs text-slate-400">
                  Paid on {new Date(payment.paidAt).toLocaleString()}
                </p>
              )}
              {payment?.receiptUrl && (
                <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline block">
                  View Receipt →
                </a>
              )}
            </div>
            {needsPay && (
              <button onClick={() => setShowPay(true)} className="btn-primary flex-shrink-0 gap-2">
                <CreditCardIcon className="h-4 w-4" /> Pay Now
              </button>
            )}
            {isPaid && <CheckSolid className="h-10 w-10 text-green-500 flex-shrink-0" />}
          </div>
        </div>
      )}

      {/* Review */}
      {isCompleted && !request.review && (
        <div className="card-cyber p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">⭐ Leave a Review</h2>
          <form onSubmit={handleReview} className="space-y-4">
            <div>
              <label className="label">Rating</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button" onClick={() => setReview({ ...review, rating: s })}
                    className={`text-2xl transition-all ${s <= review.rating ? 'text-amber-400 scale-110' : 'text-slate-300 dark:text-slate-600'}`}>
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Comment (optional)</label>
              <textarea className="input" rows={3}
                value={review.comment} onChange={e => setReview({ ...review, comment: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary" disabled={subReview}>
              {subReview ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {request.review && (
        <div className="card-cyber p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-2">Your Review</h2>
          <div className="text-amber-400 text-xl mb-1">
            {'★'.repeat(request.review.rating)}
            <span className="text-slate-300 dark:text-slate-600">{'☆'.repeat(5 - request.review.rating)}</span>
          </div>
          {request.review.comment && (
            <p className="text-slate-600 dark:text-slate-300 text-sm">{request.review.comment}</p>
          )}
        </div>
      )}

      {/* Payment modal */}
      {showPayment && (
        <PaymentModal
          request={request}
          onClose={() => setShowPay(false)}
          onPaid={() => { setShowPay(false); fetchAll(); }}
        />
      )}
    </div>
  );
}
