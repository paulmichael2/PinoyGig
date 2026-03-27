export const CONTRACT_TAX_RATE = 0.1;
export const WALLET_CURRENCY = 'PHP';

export const roundCurrency = (value) => {
    const amount = Number(value) || 0;
    return Math.round((amount + Number.EPSILON) * 100) / 100;
};

export const isWalletAdminUser = (user) => {
    if (!user) {
        return false;
    }

    return Boolean(user.isWalletAdmin);
};

export const findWalletAdmin = async (UserModel, session = null) => {
    const query = UserModel.findOne({ isWalletAdmin: true }).sort({ createdAt: 1 });

    if (session) {
        query.session(session);
    }

    return query;
};

export const buildWalletTransaction = ({
    type,
    amount,
    description,
    gig,
    counterparty = null,
    balanceAfter,
    metadata = {},
}) => ({
    type,
    amount: roundCurrency(amount),
    description,
    gig,
    counterparty,
    balanceAfter: roundCurrency(balanceAfter),
    currency: WALLET_CURRENCY,
    metadata,
    createdAt: new Date(),
});