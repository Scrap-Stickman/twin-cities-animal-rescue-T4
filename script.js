(function () {
  var STORAGE = {
    roles: "tcar-saved-roles",
    help: "tcar-help-choice",
    draft: "tcar-form-draft"
  };

  var volunteerRoles = [
    {
      id: "greeter",
      title: "Event greeter",
      description: "Help visitors meet pets safely at weekend adoption events."
    },
    {
      id: "transport",
      title: "Transport driver",
      description: "Move animals between clinics, foster homes, and the metro."
    },
    {
      id: "walker",
      title: "Weekend walker",
      description: "Walk and socialize dogs at partner kennels on Saturdays."
    },
    {
      id: "foster-support",
      title: "Foster support",
      description: "Drop off food, crates, and supplies to active foster homes."
    }
  ];

  var helpOptions = [
    {
      id: "volunteer",
      label: "Volunteer",
      summary: "You chose volunteer. Save one or more roles on the services page, then send an inquiry."
    },
    {
      id: "foster",
      label: "Foster",
      summary: "You chose foster. We will pre-select Foster on the inquiry form so you do not have to start over."
    },
    {
      id: "adoption",
      label: "Adopt",
      summary: "You chose adoption information. The inquiry form will open with that interest already selected."
    }
  ];

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getSavedRoleIds() {
    var saved = readJson(STORAGE.roles, []);
    return Array.isArray(saved) ? saved : [];
  }

  function saveRoleIds(ids) {
    writeJson(STORAGE.roles, ids);
  }

  function getHelpChoice() {
    return localStorage.getItem(STORAGE.help) || "";
  }

  function setHelpChoice(id) {
    localStorage.setItem(STORAGE.help, id);
    var draft = getFormDraft();
    draft.interestType = id;
    saveFormDraft(draft);
  }

  function getFormDraft() {
    return readJson(STORAGE.draft, {});
  }

  function saveFormDraft(draft) {
    writeJson(STORAGE.draft, draft);
  }

  function findRole(id) {
    var i;
    for (i = 0; i < volunteerRoles.length; i += 1) {
      if (volunteerRoles[i].id === id) {
        return volunteerRoles[i];
      }
    }
    return null;
  }

  function toggleSavedRole(id) {
    var ids = getSavedRoleIds();
    var index = ids.indexOf(id);
    if (index === -1) {
      ids.push(id);
    } else {
      ids.splice(index, 1);
    }
    saveRoleIds(ids);
    return ids;
  }

  function renderRoleCards() {
    var list = document.getElementById("role-list");
    if (!list) {
      return;
    }
    var saved = getSavedRoleIds();
    list.innerHTML = "";
    volunteerRoles.forEach(function (role) {
      var card = document.createElement("article");
      var heading = document.createElement("h3");
      var copy = document.createElement("p");
      var button = document.createElement("button");
      var isSaved = saved.indexOf(role.id) !== -1;

      card.className = "role-card";
      heading.textContent = role.title;
      copy.textContent = role.description;
      button.type = "button";
      button.setAttribute("data-role-id", role.id);
      button.textContent = isSaved ? "Remove from my list" : "Save this role";
      if (isSaved) {
        card.className = "role-card is-saved";
      }

      card.appendChild(heading);
      card.appendChild(copy);
      card.appendChild(button);
      list.appendChild(card);
    });
  }

  function renderSavedList() {
    var list = document.getElementById("saved-list");
    var empty = document.getElementById("saved-empty");
    var count = document.getElementById("saved-count");
    if (!list) {
      return;
    }
    var ids = getSavedRoleIds();
    list.innerHTML = "";
    ids.forEach(function (id) {
      var role = findRole(id);
      if (!role) {
        return;
      }
      var item = document.createElement("li");
      item.textContent = role.title;
      list.appendChild(item);
    });
    if (empty) {
      empty.hidden = ids.length > 0;
    }
    if (count) {
      count.textContent = ids.length === 1
        ? "1 role saved in this browser."
        : ids.length + " roles saved in this browser.";
    }
  }

  function handleRoleClick(event) {
    var button = event.target.closest("button[data-role-id]");
    if (!button) {
      return;
    }
    toggleSavedRole(button.getAttribute("data-role-id"));
    renderRoleCards();
    renderSavedList();
  }

  function renderHelpSelector() {
    var wrap = document.getElementById("help-buttons");
    var summary = document.getElementById("help-summary");
    if (!wrap) {
      return;
    }
    var selected = getHelpChoice();
    wrap.innerHTML = "";
    helpOptions.forEach(function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "help-choice";
      button.setAttribute("data-help-id", option.id);
      button.textContent = option.label;
      if (option.id === selected) {
        button.className = "help-choice is-selected";
      }
      wrap.appendChild(button);
    });
    if (summary) {
      if (!selected) {
        summary.textContent = "Choose a path. We remember it on the inquiry form.";
      } else {
        helpOptions.forEach(function (option) {
          if (option.id === selected) {
            summary.textContent = option.summary;
          }
        });
      }
    }
  }

  function handleHelpClick(event) {
    var button = event.target.closest("button[data-help-id]");
    if (!button) {
      return;
    }
    setHelpChoice(button.getAttribute("data-help-id"));
    renderHelpSelector();
  }

  function setError(field, message) {
    var error = document.getElementById(field.id + "-error");
    field.setAttribute("aria-invalid", "true");
    if (error) {
      error.textContent = message;
    }
  }

  function clearError(field) {
    var error = document.getElementById(field.id + "-error");
    field.removeAttribute("aria-invalid");
    if (error) {
      error.textContent = "";
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function collectDraftFromForm(form) {
    return {
      fullName: form.elements["full-name"].value,
      email: form.elements.email.value,
      interestType: form.elements["interest-type"].value,
      availability: form.elements.availability.value,
      petExperience: form.elements["pet-experience"].value,
      message: form.elements.message.value
    };
  }

  function applyDraftToForm(form, draft) {
    if (!draft) {
      return;
    }
    if (draft.fullName) {
      form.elements["full-name"].value = draft.fullName;
    }
    if (draft.email) {
      form.elements.email.value = draft.email;
    }
    if (draft.interestType) {
      form.elements["interest-type"].value = draft.interestType;
    }
    if (draft.availability) {
      form.elements.availability.value = draft.availability;
    }
    if (draft.petExperience) {
      form.elements["pet-experience"].value = draft.petExperience;
    }
    if (draft.message && draft.message.trim().length >= 10) {
      form.elements.message.value = draft.message;
    }
  }

  function validateInquiryForm(form) {
    var nameField = form.elements["full-name"];
    var emailField = form.elements.email;
    var interestField = form.elements["interest-type"];
    var messageField = form.elements.message;
    var valid = true;

    [nameField, emailField, interestField, messageField].forEach(clearError);

    if (!nameField.value.trim()) {
      setError(nameField, "Please enter your full name so we can follow up.");
      valid = false;
    }

    if (!emailField.value.trim()) {
      setError(emailField, "Please enter an email address.");
      valid = false;
    } else if (!isValidEmail(emailField.value.trim())) {
      setError(emailField, "Please enter an email that includes @ and a domain, such as name@email.com.");
      valid = false;
    }

    if (!interestField.value) {
      setError(interestField, "Please choose volunteer, foster, or adoption information.");
      valid = false;
    }

    if (messageField.value.trim().length < 10) {
      setError(messageField, "Please write at least 10 characters so we know how to help.");
      valid = false;
    }

    return valid;
  }

  function initInquiryForm() {
    var form = document.getElementById("inquiry-form");
    if (!form) {
      return;
    }
    var status = document.getElementById("form-status");
    var savedNote = document.getElementById("saved-roles-note");
    var draft = getFormDraft();
    var helpChoice = getHelpChoice();
    var savedRoles = getSavedRoleIds();

    var restoreNote = document.getElementById("restore-note");
    var restoredBits = [];
    applyDraftToForm(form, draft);
    if (helpChoice) {
      form.elements["interest-type"].value = helpChoice;
    }
    if (form.elements["full-name"].value) {
      restoredBits.push("name");
    }
    if (form.elements.email.value) {
      restoredBits.push("email");
    }
    if (form.elements["interest-type"].value) {
      restoredBits.push("interest");
    }
    if (restoreNote) {
      if (restoredBits.length) {
        restoreNote.hidden = false;
        restoreNote.textContent = "Welcome back. We restored your " + restoredBits.join(", ") + " from this browser.";
      } else {
        restoreNote.hidden = true;
      }
    }

    if (savedNote) {
      if (savedRoles.length) {
        savedNote.textContent = "We also kept these saved roles: " +
          savedRoles.map(function (id) {
            var role = findRole(id);
            return role ? role.title : id;
          }).join(", ") + ".";
      } else {
        savedNote.textContent = "You can save volunteer roles on the services page before you send this form.";
      }
    }

    form.addEventListener("input", function () {
      saveFormDraft(collectDraftFromForm(form));
      if (form.elements["full-name"].value.trim()) {
        clearError(form.elements["full-name"]);
      }
      if (isValidEmail(form.elements.email.value.trim())) {
        clearError(form.elements.email);
      }
      if (form.elements["interest-type"].value) {
        localStorage.setItem(STORAGE.help, form.elements["interest-type"].value);
        clearError(form.elements["interest-type"]);
      }
      if (form.elements.message.value.trim().length >= 10) {
        clearError(form.elements.message);
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!validateInquiryForm(form)) {
        if (status) {
          status.textContent = "Please fix the highlighted fields. Your answers are still on the form.";
        }
        return;
      }
      saveFormDraft(collectDraftFromForm(form));
      if (status) {
        status.textContent = "Inquiry saved in this browser. A coordinator will read new messages during desk hours.";
      }
      form.reset();
      localStorage.removeItem(STORAGE.draft);
    });
  }

  function init() {
    renderHelpSelector();
    renderRoleCards();
    renderSavedList();
    initInquiryForm();

    var helpWrap = document.getElementById("help-buttons");
    if (helpWrap) {
      helpWrap.addEventListener("click", handleHelpClick);
    }
    var roleList = document.getElementById("role-list");
    if (roleList) {
      roleList.addEventListener("click", handleRoleClick);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
