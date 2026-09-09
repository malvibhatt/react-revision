// packages/event-bus/index.js

// 1. Strongly typed event names to keep MFEs aligned
export const SHOP_EVENTS = {
  ITEM_ADDED: "catalog:item-added",
  USER_LOGOUT: "auth:logout",
};
const userPermissions = {
  roles: ["editor"],
  permissions: ["catalog:read", "catalog:write", "billing:read"],
};
export const SHOP_AUTH = {
  hasPermission: (permission) =>
    userPermissions.permissions.includes(permission),
  hasRole: (role) => userPermissions.roles.includes(role),
};

// 2. Global safe map to ensure all MFEs share the exact same listener pool
const GLOBAL_BUS_KEY = Symbol.for("shop.eventBus.listeners");
if (!window[GLOBAL_BUS_KEY]) {
  window[GLOBAL_BUS_KEY] = new Map();
}
const listeners = window[GLOBAL_BUS_KEY];

export const eventBus = {
  // Publish an event out into the ecosystem
  publish(eventName, payload) {
    if (listeners.has(eventName)) {
      listeners.get(eventName).forEach((callback) => callback(payload));
    }
  },

  // Subscribe to an event and return an unsubscribe function
  subscribe(eventName, callback) {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName).add(callback);

    // Return teardown function instantly to make useEffect implementation clean
    return () => {
      const eventListeners = listeners.get(eventName);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          listeners.delete(eventName);
        }
      }
    };
  },
};
