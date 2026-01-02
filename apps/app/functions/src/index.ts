/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at
 * https://firebase.google.com/docs/functions
 */

import * as admin from "firebase-admin";

import { setGlobalOptions } from "firebase-functions/v2";

export { generateBranchSessions } from "./classes/generateBranchSessions";
export {
  onEnrollmentWritten,
  onMemberEnrollmentWritten,
  recomputeBranchEnrollmentCounts,
  recomputeBranchSessionEnrollmentCounts,
} from "./classes/classEnrollmentCounts";
export { suspendMembership } from "./memberships/suspendMembership";
export { cancelMembership } from "./memberships/cancelMembership";
export { adjustMembershipDays } from "./memberships/adjustMembershipDays";

export * from "./summaries";
export * from "./automation";

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v2 API, maxInstances controls concurrency at the container level.
setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();
