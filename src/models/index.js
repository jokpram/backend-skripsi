import sequelize from '../config/database.js';
import Admin from './Admin.js';
import Petambak from './Petambak.js';
import Logistik from './Logistik.js';
import Konsumen from './Konsumen.js';
import Tambak from './Tambak.js';
import BatchUdang from './BatchUdang.js';
import UdangProduk from './UdangProduk.js';
import Order from './Order.js';
import OrderItem from './OrderItem.js';
import PaymentLog from './PaymentLog.js';
import Wallet from './Wallet.js';
import WalletTransaction from './WalletTransaction.js';
import Delivery from './Delivery.js';
import WithdrawRequest from './WithdrawRequest.js';

// Associations

// Petambak -> Tambak
Petambak.hasMany(Tambak, { foreignKey: 'petambak_id' });
Tambak.belongsTo(Petambak, { foreignKey: 'petambak_id' });

// Tambak -> BatchUdang
Tambak.hasMany(BatchUdang, { foreignKey: 'tambak_id' });
BatchUdang.belongsTo(Tambak, { foreignKey: 'tambak_id' });

// BatchUdang -> UdangProduk
BatchUdang.hasMany(UdangProduk, { foreignKey: 'batch_id' });
UdangProduk.belongsTo(BatchUdang, { foreignKey: 'batch_id' });

// Konsumen -> Order
Konsumen.hasMany(Order, { foreignKey: 'konsumen_id' });
Order.belongsTo(Konsumen, { foreignKey: 'konsumen_id' });

// Order -> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

// OrderItem -> UdangProduk
UdangProduk.hasMany(OrderItem, { foreignKey: 'produk_id' });
OrderItem.belongsTo(UdangProduk, { foreignKey: 'produk_id' });

// Order -> Delivery
Order.hasOne(Delivery, { foreignKey: 'order_id' });
Delivery.belongsTo(Order, { foreignKey: 'order_id' });

// Logistik -> Delivery
Logistik.hasMany(Delivery, { foreignKey: 'logistik_id' });
Delivery.belongsTo(Logistik, { foreignKey: 'logistik_id' });

// Order -> PaymentLog
Order.hasMany(PaymentLog, { foreignKey: 'order_id' });
PaymentLog.belongsTo(Order, { foreignKey: 'order_id' });

// Wallet -> WalletTransaction
Wallet.hasMany(WalletTransaction, { foreignKey: 'wallet_id', as: 'transactions' });
WalletTransaction.belongsTo(Wallet, { foreignKey: 'wallet_id' });

// Wallet -> WithdrawRequest
Wallet.hasMany(WithdrawRequest, { foreignKey: 'wallet_id' });
WithdrawRequest.belongsTo(Wallet, { foreignKey: 'wallet_id' });

const models = {
    Admin,
    Petambak,
    Logistik,
    Konsumen,
    Tambak,
    BatchUdang,
    UdangProduk,
    Order,
    OrderItem,
    PaymentLog,
    Wallet,
    WalletTransaction,
    Delivery,
    WithdrawRequest
};

export { sequelize };
export default models;
