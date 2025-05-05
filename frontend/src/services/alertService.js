// Alert service for managing alerts throughout the application
import { ref } from "vue";

const alertSystemRef = ref(null);

export const useAlertService = () => {
  // Register the alert system component
  const registerAlertSystem = (componentRef) => {
    alertSystemRef.value = componentRef;
  };

  // Show an alert
  const showAlert = (message, type = "info", duration = 5000) => {
    if (alertSystemRef.value) {
      return alertSystemRef.value.addAlert(message, type, duration);
    } else {
      console.warn("Alert system not registered. Message:", message);
      return -1;
    }
  };

  // Remove an alert
  const removeAlert = (id) => {
    if (alertSystemRef.value) {
      alertSystemRef.value.removeAlert(id);
    }
  };

  return {
    registerAlertSystem,
    showAlert,
    removeAlert,
  };
};

// Create a singleton instance
const alertService = useAlertService();
export default alertService;
