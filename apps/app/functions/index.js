const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Entrypoint central das Cloud Functions.
 * Cada função fica em um submódulo dentro de /src.
 */
exports.processScheduledSuspensions =
  require("./src/suspensions/processScheduledSuspensions");
exports.processScheduledCancellations =
  require("./src/clientContracts/processScheduledCancellations");
exports.processSuspensionEnds =
  require("./src/suspensions/processSuspensionEnds");

exports.generateSessionsOnClassCreate =
  require("./src/classes/generateSessionsOnClassCreate");

exports.incrementSessionOccupancy =
  require("./src/classes/sessionOccupancy").incrementSessionOccupancy;
exports.decrementSessionOccupancy =
  require("./src/classes/sessionOccupancy").decrementSessionOccupancy;


exports.enrollmentOccupancyOnCreate =
  require("./src/enrollments/occupancyTriggers");
exports.enrollmentOccupancyOnDelete =
  require("./src/enrollments/occupancyTriggers").onDelete;
exports.enrollmentOccupancyOnUpdate =
  require("./src/enrollments/occupancyTriggers").onUpdate;

exports.autoAttendanceProcess =
  require("./src/enrollments/autoAttendanceTrigger");

exports.attendanceMonthlyOnAttendanceWrite =
  require("./src/attendance/attendanceMonthlyTriggers").onAttendanceWrite;
exports.attendanceMonthlyOnEnrollmentWrite =
  require("./src/attendance/attendanceMonthlyTriggers").onEnrollmentWrite;

exports.enrollmentClientCountersOnCreate =
  require("./src/enrollments/clientEnrollmentCounters");
exports.enrollmentClientCountersOnDelete =
  require("./src/enrollments/clientEnrollmentCounters").onDelete;
exports.enrollmentClientCountersOnUpdate =
  require("./src/enrollments/clientEnrollmentCounters").onUpdate;

exports.funnelTrackNewLead = require("./src/leads/funnel").trackNewLead;
exports.funnelTrackExperimental = require("./src/leads/funnel").trackExperimentalScheduled;
exports.funnelTrackConversion = require("./src/leads/funnel").trackConversion;
exports.funnelTrackAttendance = require("./src/leads/funnel").trackExperimentalAttendance;
exports.funnelTrackCancellation = require("./src/leads/funnel").trackExperimentalDeletion;

// Financeiro
exports.autoCloseCashier = require("./src/financial/autoClose").autoCloseCashier;
exports.processContractDefaultCancellation = require("./src/financial/scheduledTasks").processContractDefaultCancellation;
exports.processSalesDeletion = require("./src/financial/scheduledTasks").processSalesDeletion;
exports.onFinancialTransactionWrite = require("./src/financial/financialTriggers").onFinancialTransactionWrite;
exports.onSaleWrite = require("./src/financial/financialTriggers").onSaleWrite;
exports.onClientContractWrite = require("./src/clientContracts/clientContractTriggers").onClientContractWrite;
exports.openCashier = require("./src/financial/cashier").openCashier;
exports.closeCashier = require("./src/financial/cashier").closeCashier;
exports.addExpense = require("./src/financial/transactions").addExpense;
exports.addSaleRevenue = require("./src/financial/transactions").addSaleRevenue;
exports.updateFinancialTransaction = require("./src/financial/transactions").updateFinancialTransaction;
exports.deleteFinancialTransaction = require("./src/financial/transactions").deleteFinancialTransaction;
exports.addReceivable = require("./src/financial/receivables").addReceivable;
exports.updateReceivable = require("./src/financial/receivables").updateReceivable;
exports.deleteReceivable = require("./src/financial/receivables").deleteReceivable;
exports.payReceivables = require("./src/financial/receivables").payReceivables;
exports.addClientCredit = require("./src/financial/credits").addClientCredit;
exports.consumeClientCredit = require("./src/financial/credits").consumeClientCredit;
exports.deleteClientCredit = require("./src/financial/credits").deleteClientCredit;

// Vendas
exports.createSale = require("./src/sales/sales").saveSale;

// Contratos do Cliente
exports.createClientContract = require("./src/clientContracts/clientContracts").createClientContract;
exports.scheduleContractSuspension = require("./src/clientContracts/clientContracts").scheduleContractSuspension;
exports.stopClientContractSuspension = require("./src/clientContracts/clientContracts").stopClientContractSuspension;
exports.cancelClientContract = require("./src/clientContracts/clientContracts").cancelClientContract;

// Attendance
exports.markAttendance = require("./src/attendance/attendance").markAttendance;
exports.saveSessionSnapshot = require("./src/attendance/attendance").saveSessionSnapshot;
exports.addExtraParticipantToSession = require("./src/attendance/attendance").addExtraParticipantToSession;

// Classes
exports.generateClassSessions = require("./src/classes/classes").generateClassSessions;
exports.createClass = require("./src/classes/classes").createClass;
exports.updateClass = require("./src/classes/manageClass").updateClass;
exports.deleteClass = require("./src/classes/manageClass").deleteClass;

// Events
exports.createEvent = require("./src/events/events").createEvent;
exports.updateEvent = require("./src/events/events").updateEvent;
exports.deleteEvent = require("./src/events/events").deleteEvent;

// Clients
exports.getNextClientGymId = require("./src/clients/clients").getNextClientGymId;
exports.createClient = require("./src/clients/clients").createClient;
exports.updateClient = require("./src/clients/clients").updateClient;

// Enrollments
// Enrollments
exports.deleteEnrollment = require("./src/enrollments/enrollments").deleteEnrollment;
exports.createRecurringEnrollment = require("./src/enrollments/enrollments").createRecurringEnrollment;
exports.createSingleSessionEnrollment = require("./src/enrollments/enrollments").createSingleSessionEnrollment;

// Catalog Contracts (Templates)
exports.createContract = require("./src/contracts/contracts").createContract;
exports.updateContract = require("./src/contracts/contracts").updateContract;
exports.createStaffUser = require("./src/staff/staff").createStaffUser;
exports.updateStaffUser = require("./src/staff/staff").updateStaffUser;

// Integrations
exports.saveIntegrationConfig = require("./src/integrations/integrations").saveIntegrationConfig;
exports.getIntegrationConfig = require("./src/integrations/integrations").getIntegrationConfig;

// Notifications
// Notifications
exports.sendWhatsAppMessage = require("./src/notifications/whatsapp").sendWhatsAppMessage;

// Automations
exports.saveAutomation = require("./src/automations/automations").saveAutomation;
exports.getAutomations = require("./src/automations/automations").getAutomations;
exports.deleteAutomation = require("./src/automations/automations").deleteAutomation;
exports.checkBirthdayAutomations = require("./src/automations/scheduled").checkBirthdayAutomations;




