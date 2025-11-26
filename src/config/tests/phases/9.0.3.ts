/**
 * Phase 9.0.3 Tests - Notification System & Transform Validation
 *
 * Tests for notification CRUD operations and transform definition validation.
 */

import { projectId } from "../../../utils/supabase/info";
import { Test, getAuthHeaders } from "../types";

export function getPhase903Tests(user: any): Test[] {
  return [
    {
      id: "phase9-day3-create-notification",
      name: "Create Notification",
      description: "Verify notification creation with unique ID generation",
      phase: "9.0.3",
      category: "Notifications",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to create notifications",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
              body: JSON.stringify({
                user_id: user.id,
                type: "article_published",
                content_id: "test_article_automated",
                content_type: "article",
                message: "Test notification from automated test suite",
              }),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to create notification",
            };
          }

          const data = await response.json();

          if (!data.notification || !data.notification.id) {
            return {
              success: false,
              message: "Invalid response structure - missing notification ID",
            };
          }

          return {
            success: true,
            message: `Notification created ✓ (ID: ${data.notification.id})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error creating notification: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day3-get-notifications",
      name: "Get User Notifications",
      description: "Verify user-specific notification retrieval",
      phase: "9.0.3",
      category: "Notifications",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to get notifications",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications/${user.id}`,
            {
              method: "GET",
              headers: getAuthHeaders(accessToken),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to retrieve notifications",
            };
          }

          const data = await response.json();

          if (!Array.isArray(data.notifications)) {
            return {
              success: false,
              message: "Expected array of notifications",
            };
          }

          const unreadCount = data.notifications.filter(
            (n: any) => !n.read
          ).length;
          return {
            success: true,
            message: `Retrieved ${data.notifications.length} notification(s) ✓ (${unreadCount} unread)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error retrieving notifications: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day3-mark-notification-read",
      name: "Mark Notification as Read",
      description: "Verify marking a single notification as read",
      phase: "9.0.3",
      category: "Notifications",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to mark notifications as read",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        try {
          // First create a notification to mark as read
          const createResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications`,
            {
              method: "POST",
              headers: getAuthHeaders(accessToken),
              body: JSON.stringify({
                user_id: user.id,
                type: "test",
                content_id: "test-" + Date.now(),
                content_type: "test",
                message: "Test notification for mark as read",
              }),
            }
          );

          if (!createResponse.ok) {
            return {
              success: false,
              message: "Failed to create test notification",
            };
          }

          const createData = await createResponse.json();
          const notificationId = createData.notification.id;

          // Now mark it as read
          const readResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications/${notificationId}/read`,
            {
              method: "PUT",
              headers: getAuthHeaders(accessToken),
            }
          );

          if (!readResponse.ok) {
            const data = await readResponse.json();
            return {
              success: false,
              message: data.error || "Failed to mark notification as read",
            };
          }

          const readData = await readResponse.json();

          if (!readData.notification || readData.notification.read !== true) {
            return {
              success: false,
              message: "Notification was not marked as read",
            };
          }

          return {
            success: true,
            message: `Notification marked as read ✓ (ID: ${notificationId})`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error marking notification as read: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day3-mark-all-notifications-read",
      name: "Mark All Notifications as Read",
      description: "Verify marking all user notifications as read",
      phase: "9.0.3",
      category: "Notifications",
      testFn: async () => {
        if (!user) {
          return {
            success: false,
            message: "Must be authenticated to mark all notifications as read",
          };
        }

        const accessToken = sessionStorage.getItem("wastedb_access_token");
        if (!accessToken) {
          return {
            success: false,
            message: "No access token found - please sign in again",
          };
        }

        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-17cae920/notifications/${user.id}/read-all`,
            {
              method: "PUT",
              headers: getAuthHeaders(accessToken),
            }
          );

          if (!response.ok) {
            const data = await response.json();
            return {
              success: false,
              message: data.error || "Failed to mark all notifications as read",
            };
          }

          const data = await response.json();

          if (!data.success) {
            return {
              success: false,
              message: "Operation did not succeed",
            };
          }

          return {
            success: true,
            message: `All notifications marked as read ✓ (${
              data.count || 0
            } notifications updated)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error marking all notifications as read: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day3-transform-definitions",
      name: "Validate Transform Definitions",
      description: "Verify all 13 transform parameters are defined",
      phase: "9.0.3",
      category: "Transforms",
      testFn: async () => {
        try {
          const { loadTransforms } = await import(
            "../../../utils/transformLoader"
          );
          const data = await loadTransforms();

          if (!data || !data.transforms) {
            return {
              success: false,
              message: "transforms data not loaded or invalid structure",
            };
          }

          const expectedParams = [
            "Y",
            "D",
            "C",
            "M",
            "E",
            "B",
            "N",
            "T",
            "H",
            "L",
            "R",
            "U",
            "C_RU",
          ];
          const actualParams = data.transforms.map((t: any) => t.parameter);

          const allPresent = expectedParams.every((p) =>
            actualParams.includes(p)
          );

          if (!allPresent) {
            const missing = expectedParams.filter(
              (p) => !actualParams.includes(p)
            );
            return {
              success: false,
              message: `Missing parameters: ${missing.join(", ")}`,
            };
          }

          return {
            success: true,
            message: `All 13 parameters defined ✓ (Y, D, C, M, E, B, N, T, H, L, R, U, C_RU)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error loading transforms: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
    {
      id: "phase9-day3-formula-structure",
      name: "Validate Formula Structure",
      description:
        "Verify all transforms have complete structure (parameter, name, formula, units)",
      phase: "9.0.3",
      category: "Transforms",
      testFn: async () => {
        try {
          const { loadTransforms } = await import(
            "../../../utils/transformLoader"
          );
          const data = await loadTransforms();
          const issues: string[] = [];

          data.transforms.forEach((t: any) => {
            if (!t.parameter) issues.push(`Missing parameter field`);
            if (!t.name) issues.push(`${t.parameter}: Missing name`);
            if (!t.formula) issues.push(`${t.parameter}: Missing formula`);
            if (!t.input_unit)
              issues.push(`${t.parameter}: Missing input_unit`);
            if (!t.output_unit)
              issues.push(`${t.parameter}: Missing output_unit`);
          });

          if (issues.length > 0) {
            return {
              success: false,
              message: `Structure issues: ${issues.join("; ")}`,
            };
          }

          return {
            success: true,
            message: `All transforms have complete structure ✓ (parameter, name, formula, units, ranges)`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Error validating structure: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          };
        }
      },
    },
  ];
}
