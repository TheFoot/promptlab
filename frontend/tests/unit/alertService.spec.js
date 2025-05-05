import { describe, it, expect, vi, beforeEach } from "vitest";
// ref is not used in this file
// import { ref } from "vue";
import alertService from "../../src/services/alertService";

describe("alertService", () => {
  beforeEach(() => {
    // Reset the console.warn mock between tests
    console.warn = vi.fn();
  });

  it("shows warning when alert system is not registered", () => {
    // Clear alert system reference
    alertService.registerAlertSystem(null);

    // Try to show an alert
    const result = alertService.showAlert("Test message", "info");

    // Check that console.warn was called
    expect(console.warn).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      "Alert system not registered. Message:",
      "Test message",
    );

    // Check that it returns -1 when no alert system is registered
    expect(result).toBe(-1);
  });

  it("registers alert system and shows alerts", () => {
    // Create a mock alert system component
    const mockAlertSystem = {
      addAlert: vi.fn().mockReturnValue(123),
      removeAlert: vi.fn(),
    };

    // Register the mock alert system
    alertService.registerAlertSystem(mockAlertSystem);

    // Show an alert
    const alertId = alertService.showAlert("Test message", "success", 3000);

    // Check that addAlert was called with the correct parameters
    expect(mockAlertSystem.addAlert).toHaveBeenCalledWith(
      "Test message",
      "success",
      3000,
    );

    // Check that it returns the ID from the alert system
    expect(alertId).toBe(123);
  });

  it("removes alerts when alert system is registered", () => {
    // Create a mock alert system component
    const mockAlertSystem = {
      addAlert: vi.fn(),
      removeAlert: vi.fn(),
    };

    // Register the mock alert system
    alertService.registerAlertSystem(mockAlertSystem);

    // Remove an alert
    alertService.removeAlert(123);

    // Check that removeAlert was called with the correct ID
    expect(mockAlertSystem.removeAlert).toHaveBeenCalledWith(123);
  });

  it("does nothing when trying to remove alerts without registered system", () => {
    // Clear alert system reference
    alertService.registerAlertSystem(null);

    // Try to remove an alert
    alertService.removeAlert(123);

    // Nothing should happen, no errors thrown
  });

  it("uses default parameters when not provided", () => {
    // Create a mock alert system component
    const mockAlertSystem = {
      addAlert: vi.fn().mockReturnValue(123),
      removeAlert: vi.fn(),
    };

    // Register the mock alert system
    alertService.registerAlertSystem(mockAlertSystem);

    // Show an alert with only a message
    alertService.showAlert("Test message");

    // Check that addAlert was called with the default parameters
    expect(mockAlertSystem.addAlert).toHaveBeenCalledWith(
      "Test message",
      "info",
      5000,
    );
  });
});
