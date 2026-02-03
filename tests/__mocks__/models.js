// Mock Sequelize models for unit testing
const mockSequelize = {
    transaction: jest.fn(() => ({
        commit: jest.fn(),
        rollback: jest.fn(),
        LOCK: { UPDATE: 'UPDATE' }
    })),
    define: jest.fn(),
    sync: jest.fn()
};

const createMockModel = (name) => {
    const Model = {
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        count: jest.fn(),
        belongsTo: jest.fn(),
        hasMany: jest.fn(),
        hasOne: jest.fn()
    };
    return Model;
};

export const Admin = createMockModel('Admin');
export const Petambak = createMockModel('Petambak');
export const Logistik = createMockModel('Logistik');
export const Konsumen = createMockModel('Konsumen');
export const Tambak = createMockModel('Tambak');
export const BatchUdang = createMockModel('BatchUdang');
export const UdangProduk = createMockModel('UdangProduk');
export const Order = createMockModel('Order');
export const OrderItem = createMockModel('OrderItem');
export const Delivery = createMockModel('Delivery');
export const Wallet = createMockModel('Wallet');
export const WalletTransaction = createMockModel('WalletTransaction');
export const WithdrawRequest = createMockModel('WithdrawRequest');
export const PaymentLog = createMockModel('PaymentLog');

export const sequelize = mockSequelize;

export default {
    Admin,
    Petambak,
    Logistik,
    Konsumen,
    Tambak,
    BatchUdang,
    UdangProduk,
    Order,
    OrderItem,
    Delivery,
    Wallet,
    WalletTransaction,
    WithdrawRequest,
    PaymentLog,
    sequelize
};
