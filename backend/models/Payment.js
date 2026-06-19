const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    'Payment',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'service_requests', key: 'id' },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      // ── Payment method ──────────────────────────────────────────────────
      paymentMethod: {
        type: DataTypes.ENUM(
          'stripe',
          'mpesa',
          'airtel_money',
          'tigo_pesa',
          'mtn_momo',
          'binance',
          'manual'
        ),
        defaultValue: 'stripe',
        allowNull: false,
      },
      // ── Stripe fields ───────────────────────────────────────────────────
      stripePaymentIntentId: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: true, // null for non-Stripe payments
      },
      // ── Mobile money / crypto fields ────────────────────────────────────
      providerRef: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Mobile money transaction ID or crypto TX hash',
      },
      phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Phone number used for mobile money payment',
      },
      cryptoAddress: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Binance wallet address or USDT address',
      },
      cryptoNetwork: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'e.g. BEP20, TRC20, ERC20',
      },
      // ── Common fields ───────────────────────────────────────────────────
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Amount in smallest currency unit (cents for USD, TZS, KES)',
      },
      currency: {
        type: DataTypes.STRING(5),
        defaultValue: 'usd',
      },
      status: {
        type: DataTypes.ENUM('pending', 'awaiting_confirmation', 'succeeded', 'failed', 'cancelled', 'refunded'),
        defaultValue: 'pending',
      },
      receiptUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      adminConfirmedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Admin user ID who manually confirmed mobile money payment',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.TEXT,  // stored as JSON string for MySQL 5.x compatibility
        allowNull: true,
        get() {
          const v = this.getDataValue('metadata');
          try { return v ? JSON.parse(v) : null; } catch { return null; }
        },
        set(v) {
          this.setDataValue('metadata', v ? JSON.stringify(v) : null);
        },
      },
    },
    {
      tableName: 'payments',
      timestamps: true,
    }
  );

  return Payment;
};
