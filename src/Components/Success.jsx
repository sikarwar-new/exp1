import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { addToPendingNotes } from "../services/notesService";

function Success() {
  const location = useLocation();
  const navigate = useNavigate();
  const { purchasedItems, paymentId, userEmail } = location.state || {
    purchasedItems: [],
  };
  const { user } = useAuth();

  useEffect(() => {
    const addNotesToPending = async () => {
      if (purchasedItems.length && user?.email) {
        // Extract note IDs from purchased items
        const noteIds = purchasedItems.map(item => item.id).filter(Boolean);

        if (noteIds.length > 0) {
          const { error } = await addToPendingNotes(user.uid, noteIds, paymentId);

          if (error) {
            console.error("Failed to add notes to pending:", error);
          } else {
            console.log("Notes added to pending successfully");
          }
        }
      }
    };

    addNotesToPending();
  }, [purchasedItems, paymentId, user]);

  if (purchasedItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24">
        <p className="text-gray-700 text-center text-lg">
          No purchase information found. Please make a purchase first.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-white to-orange-50 flex items-center justify-center px-4 pt-24">
      <div className="max-w-md w-full bg-yellow-100 rounded-xl shadow-lg p-8 text-center text-yellow-900 space-y-6">
        <h2 className="text-3xl font-bold">Payment Pending Verification</h2>
        <p>
          Thank you for your payment submission. Your payment ID{" "}
          <span className="font-mono bg-white px-2 py-1 rounded">
            {paymentId || "N/A"}
          </span>{" "}
          is under verification.
        </p>
        <p>
          Please wait up to 6 hours for verification and access to your notes.
        </p>

        <div>
          <p className="mb-2 font-semibold">You purchased:</p>
          <ul className="list-disc list-inside text-left max-h-48 overflow-y-auto px-4 max-w-sm mx-auto">
            {purchasedItems.map((item) => (
              <li key={item.title}>
                {item.title} — ₹{item.price} x {item.quantity || 1}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => navigate("/study")}
          className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition duration-200"
        >
          Go to Study
        </button>
      </div>
    </div>
  );
}

export default Success;
