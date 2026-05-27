import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { payrollService } from '../../services/payrollService'
import { employeeService } from '../../services/employeeService'
import LoadingSpinner from '../common/LoadingSpinner'
import { formatDate, formatCurrency, getStatusBadgeClass, getErrorMessage, getMonthName } from '../../utils/helpers'
import { ROLES, MONTHS, YEARS } from '../../utils/constants'

const PayrollList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === ROLES.ADMIN

  const [payrolls, setPayrolls] = useState([])
  const [filteredPayrolls, setFilteredPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')

  // Bulk Generate State
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1)
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear())
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadPayrolls()
  }, [user])

  useEffect(() => {
    let filtered = payrolls

    if (filterMonth) {
      filtered = filtered.filter(p => p.month === parseInt(filterMonth))
    }
    if (filterYear) {
      filtered = filtered.filter(p => p.year === parseInt(filterYear))
    }

    setFilteredPayrolls(filtered)
  }, [payrolls, filterMonth, filterYear])

  const loadPayrolls = async () => {
    try {
      setLoading(true)
      setError('')

      if (isAdmin) {
        const data = await payrollService.getAllPayrolls()
        setPayrolls(data)
      } else {
        const employee = await employeeService.getEmployeeByUserId(user.id)
        const data = await payrollService.getPayrollsByEmployee(employee.employeeId)
        setPayrolls(data)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayroll = async (payrollId) => {
    try {
      await payrollService.processPayroll(payrollId)
      loadPayrolls()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleBulkGenerate = async () => {
    try {
      setGenerating(true)
      await payrollService.generateAllPayrolls(parseInt(generateMonth), parseInt(generateYear))
      setShowGenerateModal(false)
      loadPayrolls()
      alert('Payroll generation started successfully!')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading payroll records..." />
  }

  return (
    <div className="page-transition">
      <div className="card">
        <div className="card-header">
          <div className="row align-items-center">
            <div className="col-md-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-receipt me-2"></i>
                {isAdmin ? 'Payroll Management' : 'My Payroll Records'} ({filteredPayrolls.length})
              </h5>
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select form-select-sm"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">All Years</option>
                {YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 text-end">
              {isAdmin && (
                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowGenerateModal(true)}
                    title="Generate All Payrolls"
                  >
                    <i className="bi bi-collection"></i>
                  </button>
                  <Link to="/payroll/new" className="btn btn-sm btn-primary">
                    <i className="bi bi-plus-lg me-1"></i>
                    New
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {filteredPayrolls.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-receipt fs-1 text-muted d-block mb-3"></i>
              <h5>No payroll records found</h5>
              <p className="text-muted">
                {filterMonth || filterYear ? 'Try adjusting your filters' : 'No payroll records available'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    {isAdmin && <th>Employee</th>}
                    <th>Period</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayrolls.map((payroll) => (
                    <tr key={payroll.payrollId}>
                      {isAdmin && (
                        <td>
                          <div className="fw-semibold">Employee #{payroll.employeeId}</div>
                        </td>
                      )}
                      <td>
                        <div className="fw-semibold">{getMonthName(payroll.month)} {payroll.year}</div>
                        <small className="text-muted">Generated: {formatDate(payroll.generatedDate)}</small>
                      </td>
                      <td>{formatCurrency(payroll.baseSalary)}</td>
                      <td>{formatCurrency(payroll.allowances)}</td>
                      <td>{formatCurrency(payroll.deductions)}</td>
                      <td>
                        <strong className="text-success fs-6">
                          {formatCurrency(payroll.netSalary)}
                        </strong>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(payroll.status)}>
                          {payroll.status}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-info"
                            onClick={() => navigate(`/payroll/details/${payroll.payrollId}`)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {isAdmin && payroll.status === 'PENDING' && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleProcessPayroll(payroll.payrollId)}
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => {
                              // Generate PDF or print payslip
                              window.print()
                            }}
                          >
                            <i className="bi bi-printer"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Generate Modal */}
      {showGenerateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Generate All Payrolls</h5>
                <button type="button" className="btn-close" onClick={() => setShowGenerateModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  This will generate payroll records for <strong>ALL</strong> active employees who don't already have one for the selected period.
                  <br />
                  <small>Calculations are based on <strong>Attendance</strong> and <strong>Approved Leaves</strong>.</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Month</label>
                  <select
                    className="form-select"
                    value={generateMonth}
                    onChange={(e) => setGenerateMonth(e.target.value)}
                  >
                    {MONTHS.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Year</label>
                  <select
                    className="form-select"
                    value={generateYear}
                    onChange={(e) => setGenerateYear(e.target.value)}
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)} disabled={generating}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleBulkGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PayrollList
