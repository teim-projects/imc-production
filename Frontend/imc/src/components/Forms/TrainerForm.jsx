import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const pageStyles = `
  :root {
    --page-bg: #f8fafc;
    --card-bg: #ffffff;
    --primary-text: #1e293b;
    --secondary-text: #64748b;
    --border-color: #e2e8f0;

    --header-gradient-start: #2563eb;
    --header-gradient-end: #7c3aed;

    --btn-orange-start: #fb923c;
    --btn-orange-end: #f97316;

    --success: #16a34a;
    --success-soft: #dcfce7;

    --danger: #ef4444;
    --danger-soft: #fee2e2;

    --warning: #f59e0b;
    --warning-soft: #fef3c7;

    --shadow-main: 0 10px 35px rgba(15, 23, 42, 0.08);
    --shadow-soft: 0 4px 14px rgba(15, 23, 42, 0.06);
    --radius-lg: 18px;
    --radius-md: 14px;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    background: var(--page-bg);
    font-family: Arial, Helvetica, sans-serif;
  }

  .payment-page {
    width: 100%;
    min-height: 100vh;
    padding: 24px;
    background: var(--page-bg);
  }

  .payment-report-card {
    max-width: 1180px;
    margin: 0 auto;
    background: var(--card-bg);
    border-radius: 22px;
    box-shadow: var(--shadow-main);
    overflow: hidden;
    border: 1px solid rgba(226, 232, 240, 0.85);
  }

  .report-header {
    background: linear-gradient(90deg, var(--header-gradient-start), var(--header-gradient-end));
    color: #fff;
    padding: 22px 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .report-header h2 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
    line-height: 1.1;
  }

  .report-header p {
    margin: 6px 0 0;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.86);
  }

  .refresh-btn {
    border: none;
    outline: none;
    background: linear-gradient(135deg, var(--btn-orange-start), var(--btn-orange-end));
    color: #fff;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.25s ease;
    min-width: 110px;
    box-shadow: 0 8px 18px rgba(249, 115, 22, 0.28);
  }

  .refresh-btn:hover {
    transform: translateY(-1px);
    filter: brightness(1.03);
  }

  .refresh-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .report-body {
    padding: 24px;
    background: #f8fafc;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 22px;
  }

  .stat-box {
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding: 18px;
    box-shadow: var(--shadow-soft);
  }

  .stat-label {
    display: block;
    font-size: 13px;
    color: var(--secondary-text);
    margin-bottom: 8px;
  }

  .stat-box h3 {
    margin: 0;
    font-size: 30px;
    color: var(--primary-text);
    font-weight: 800;
  }

  .text-success {
    color: #10b981 !important;
  }

  .text-danger {
    color: #ef4444 !important;
  }

  .text-warning {
    color: #f59e0b !important;
  }

  .filter-card {
    background: #fff;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-soft);
    padding: 16px;
    margin-bottom: 20px;
  }

  .filter-grid {
    display: grid;
    grid-template-columns: 1.8fr 0.8fr;
    gap: 14px;
  }

  .search-input,
  .filter-select {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    border: 1px solid #dbe2ea;
    padding: 0 14px;
    font-size: 14px;
    color: var(--primary-text);
    background: #f8fafc;
    transition: all 0.2s ease;
  }

  .search-input:focus,
  .filter-select:focus {
    outline: none;
    border-color: #7c3aed;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.12);
  }

  .error-box {
    margin-bottom: 18px;
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
    padding: 14px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
  }

  .loading-box {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: var(--secondary-text);
    gap: 14px;
  }

  .loader {
    width: 42px;
    height: 42px;
    border: 4px solid #dbeafe;
    border-top: 4px solid #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .table-card {
    background: #fff;
    border-radius: var(--radius-lg);
    overflow: hidden;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-soft);
  }

  .table-responsive {
    width: 100%;
    overflow-x: auto;
  }

  .payment-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 1100px;
  }

  .payment-table thead tr {
    background: #0f172a;
  }

  .payment-table thead th {
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    padding: 16px 14px;
    text-align: left;
    white-space: nowrap;
  }

  .payment-table tbody td {
    padding: 16px 14px;
    border-bottom: 1px solid #edf2f7;
    color: var(--primary-text);
    font-size: 14px;
    vertical-align: middle;
  }

  .payment-table tbody tr {
    transition: background 0.2s ease;
  }

  .payment-table tbody tr:hover {
    background: #f8fbff;
  }

  .customer-cell {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 180px;
  }

  .avatar-circle {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2563eb, #7c3aed);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 14px;
    flex-shrink: 0;
  }

  .customer-info strong {
    display: block;
    font-size: 14px;
    color: var(--primary-text);
  }

  .amount-cell {
    font-weight: 800;
    color: #15803d;
    white-space: nowrap;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 82px;
    padding: 7px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  .status-success {
    background: var(--success-soft);
    color: var(--success);
  }

  .status-failed {
    background: var(--danger-soft);
    color: var(--danger);
  }

  .status-pending {
    background: var(--warning-soft);
    color: #b45309;
  }

  .no-data {
    text-align: center;
    padding: 42px 16px !important;
    color: #ef4444 !important;
    font-weight: 700;
    font-size: 15px;
  }

  @media (max-width: 991px) {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .filter-grid {
      grid-template-columns: 1fr;
    }

    .report-header h2 {
      font-size: 24px;
    }
  }

  @media (max-width: 576px) {
    .payment-page {
      padding: 14px;
    }

    .report-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .report-body {
      padding: 16px;
    }

    .report-header {
      padding: 18px;
    }
  }
`;

const PaymentReport = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await axios.get(
        "http://127.0.0.1:8000/api/payments/report/"
      );

      setPayments(response.data.payments || []);
    } catch (error) {
      console.error("Payment Fetch Error:", error);
      setError("Unable to load payment records. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const total = payments.length;
    const successful = payments.filter((p) => p.status === "CHARGED").length;
    const failed = payments.filter((p) => p.status === "FAILED").length;
    const pending = total - successful - failed;

    return { total, successful, failed, pending };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        item.name?.toLowerCase().includes(search) ||
        item.order_id?.toLowerCase().includes(search) ||
        item.service?.toLowerCase().includes(search) ||
        item.txn_id?.toLowerCase().includes(search) ||
        item.payment_method?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" ? true : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchTerm, statusFilter]);

  const formatCurrency = (amount) => {
    if (!amount) return "₹ 0";
    return `₹ ${Number(amount).toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const getStatusBadge = (status) => {
    if (status === "CHARGED") {
      return <span className="status-badge status-success">Success</span>;
    }
    if (status === "FAILED") {
      return <span className="status-badge status-failed">Failed</span>;
    }
    return (
      <span className="status-badge status-pending">
        {status || "Pending"}
      </span>
    );
  };

  return (
    <>
      <style>{pageStyles}</style>

      <div className="payment-page">
        <div className="payment-report-card">
          <div className="report-header">
            <div>
              <h2>Payment Report</h2>
              <p>Track all payment transactions in one place</p>
            </div>

            <button
              className="refresh-btn"
              onClick={() => fetchPayments(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="report-body">
            <div className="stats-grid">
              <div className="stat-box">
                <span className="stat-label">Total Records</span>
                <h3>{stats.total}</h3>
              </div>

              <div className="stat-box">
                <span className="stat-label">Successful</span>
                <h3 className="text-success">{stats.successful}</h3>
              </div>

              <div className="stat-box">
                <span className="stat-label">Failed</span>
                <h3 className="text-danger">{stats.failed}</h3>
              </div>

              <div className="stat-box">
                <span className="stat-label">Pending / Other</span>
                <h3 className="text-warning">{stats.pending}</h3>
              </div>
            </div>

            <div className="filter-card">
              <div className="filter-grid">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by customer, order ID, service, txn ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Status</option>
                  <option value="CHARGED">Success</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
            </div>

            {error && <div className="error-box">{error}</div>}

            {loading ? (
              <div className="loading-box">
                <div className="loader"></div>
                <p>Loading payment records...</p>
              </div>
            ) : (
              <div className="table-card">
                <div className="table-responsive">
                  <table className="payment-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Customer</th>
                        <th>Order ID</th>
                        <th>Service</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Method</th>
                        <th>Txn ID</th>
                        <th>UPI</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPayments.length > 0 ? (
                        filteredPayments.map((item, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>

                            <td>
                              <div className="customer-cell">
                                <div className="avatar-circle">
                                  {getInitial(item.name)}
                                </div>
                                <div className="customer-info">
                                  <strong>{item.name || "-"}</strong>
                                </div>
                              </div>
                            </td>

                            <td>{item.order_id || "-"}</td>
                            <td>{item.service || "-"}</td>
                            <td className="amount-cell">
                              {formatCurrency(item.amount)}
                            </td>
                            <td>{getStatusBadge(item.status)}</td>
                            <td>{item.payment_method || "-"}</td>
                            <td>{item.txn_id || "-"}</td>
                            <td>{item.payer_vpa || "-"}</td>
                            <td>{formatDate(item.created_at)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="no-data">
                            No Payment Records Found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentReport;
