document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function clearChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  function addText(parent, tagName, text) {
    const element = document.createElement(tagName);
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function showMessage(text, className) {
    messageDiv.textContent = text;
    messageDiv.className = className;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function resetActivityOptions() {
    clearChildren(activitySelect);

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "-- Select an activity --";
    activitySelect.appendChild(placeholder);
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.detail, "error");
        return;
      }

      showMessage(result.message, "success");
      await fetchActivities();
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  function addParticipants(activityCard, activityName, participants) {
    const section = document.createElement("div");
    section.className = "participants-section";
    addText(section, "h5", "Participants");

    if (participants.length === 0) {
      addText(section, "p", "No participants yet.");
      activityCard.appendChild(section);
      return;
    }

    const participantList = document.createElement("ul");
    participantList.className = "participants-list";

    participants.forEach((email) => {
      const item = document.createElement("li");
      item.className = "participant-item";
      addText(item, "span", email);

      const button = document.createElement("button");
      button.className = "delete-participant";
      button.type = "button";
      button.textContent = "x";
      button.title = `Unregister ${email}`;
      button.addEventListener("click", () => unregisterParticipant(activityName, email));
      item.appendChild(button);
      participantList.appendChild(item);
    });

    section.appendChild(participantList);
    activityCard.appendChild(section);
  }

  function addActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const spotsLeft = details.max_participants - details.participants.length;

    addText(activityCard, "h4", name);
    addText(activityCard, "p", details.description);
    addText(activityCard, "p", `Schedule: ${details.schedule}`);
    addText(activityCard, "p", `Availability: ${spotsLeft} spots left`);
    addParticipants(activityCard, name, details.participants);
    activitiesList.appendChild(activityCard);
  }

  function addActivityOption(name) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    activitySelect.appendChild(option);
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      clearChildren(activitiesList);
      resetActivityOptions();

      Object.entries(activities).forEach(([name, details]) => {
        addActivityCard(name, details);
        addActivityOption(name);
      });
    } catch (error) {
      clearChildren(activitiesList);
      addText(activitiesList, "p", "Failed to load activities. Please try again later.");
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail, "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
