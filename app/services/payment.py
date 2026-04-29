"""
reBorn_i — Payment Service

Handles Razorpay payment integration and subscription management.
"""

import hashlib
import hmac
from typing import Optional
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.database import Payment, User
from app.utils.exceptions import PaymentError
from app.utils.logging import get_logger

logger = get_logger(__name__)


class PaymentService:
    """Service for payment processing and verification."""

    def __init__(self, razorpay_secret: str):
        """Initialize with Razorpay API secret."""
        self.razorpay_secret = razorpay_secret

    def verify_razorpay_signature(
        self,
        order_id: str,
        payment_id: str,
        signature: str,
    ) -> bool:
        """
        Verify Razorpay payment signature.

        This ensures the payment request came from Razorpay and wasn't tampered with.

        Args:
            order_id: Razorpay order ID
            payment_id: Razorpay payment ID
            signature: Razorpay signature to verify

        Returns:
            True if signature is valid, False otherwise
        """
        try:
            # Construct the message to verify
            message = f"{order_id}|{payment_id}"

            # Create HMAC-SHA256 signature using Razorpay secret
            generated_signature = hmac.new(
                key=self.razorpay_secret.encode(),
                msg=message.encode(),
                digestmod=hashlib.sha256
            ).hexdigest()

            # Constant-time comparison to prevent timing attacks
            return hmac.compare_digest(generated_signature, signature)
        except Exception as e:
            logger.error("signature_verification_failed", error=str(e))
            return False

    async def create_payment_record(
        self,
        db: AsyncSession,
        user_id: str,
        razorpay_order_id: str,
        amount: float = 900.0,  # ₹9 in paisa
        currency: str = "INR",
    ) -> Payment:
        """
        Create a new payment record in the database.

        Args:
            db: Database session
            user_id: User ID creating the payment
            razorpay_order_id: Order ID from Razorpay
            amount: Amount in smallest currency unit (paisa)
            currency: Currency code (INR)

        Returns:
            Created Payment object
        """
        try:
            payment = Payment(
                user_id=user_id,
                razorpay_order_id=razorpay_order_id,
                amount=amount,
                currency=currency,
                status="pending",
            )
            db.add(payment)
            await db.flush()
            await db.refresh(payment)
            logger.info(
                "payment_record_created",
                order_id=razorpay_order_id,
                user_id=user_id,
            )
            return payment
        except Exception as e:
            logger.error("payment_record_creation_failed", error=str(e))
            raise PaymentError(f"Failed to create payment record: {str(e)}")

    async def verify_and_upgrade_subscription(
        self,
        db: AsyncSession,
        user_id: str,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        signature: str,
    ) -> bool:
        """
        Verify payment signature and upgrade user subscription.

        Args:
            db: Database session
            user_id: User ID to upgrade
            razorpay_order_id: Order ID
            razorpay_payment_id: Payment ID
            signature: Razorpay signature

        Returns:
            True if verification and upgrade succeeded

        Raises:
            PaymentError: If verification fails or upgrade fails
        """
        try:
            # Step 1: Verify signature
            if not self.verify_razorpay_signature(
                razorpay_order_id, razorpay_payment_id, signature
            ):
                logger.warning(
                    "payment_signature_invalid",
                    order_id=razorpay_order_id,
                    user_id=user_id,
                )
                raise PaymentError("Invalid payment signature")

            # Step 2: Find payment record
            result = await db.execute(
                select(Payment).where(
                    Payment.razorpay_order_id == razorpay_order_id,
                    Payment.user_id == user_id,
                )
            )
            payment = result.scalar_one_or_none()

            if not payment:
                logger.warning(
                    "payment_record_not_found",
                    order_id=razorpay_order_id,
                    user_id=user_id,
                )
                raise PaymentError("Payment record not found")

            # Step 3: Check if already processed (idempotent)
            if payment.status == "completed":
                logger.info(
                    "payment_already_processed",
                    order_id=razorpay_order_id,
                    user_id=user_id,
                )
                return True

            # Step 4: Update payment record
            payment.razorpay_payment_id = razorpay_payment_id
            payment.status = "completed"
            payment.updated_at = datetime.now(timezone.utc)

            # Step 5: Update user subscription
            result = await db.execute(
                select(User).where(User.id == user_id)
            )
            user = result.scalar_one_or_none()

            if not user:
                logger.error(
                    "user_not_found_during_upgrade",
                    user_id=user_id,
                )
                raise PaymentError("User not found")

            user.subscription_plan = "pro"
            user.subscription_started_at = datetime.now(timezone.utc)
            user.updated_at = datetime.now(timezone.utc)

            # Commit changes
            await db.commit()

            logger.info(
                "subscription_upgraded",
                user_id=user_id,
                order_id=razorpay_order_id,
            )
            return True

        except PaymentError:
            raise
        except Exception as e:
            logger.error(
                "subscription_upgrade_failed",
                error=str(e),
                user_id=user_id,
            )
            await db.rollback()
            raise PaymentError(f"Failed to upgrade subscription: {str(e)}")

    async def get_payment_by_order_id(
        self, db: AsyncSession, order_id: str
    ) -> Optional[Payment]:
        """Retrieve payment record by order ID."""
        result = await db.execute(
            select(Payment).where(Payment.razorpay_order_id == order_id)
        )
        return result.scalar_one_or_none()
