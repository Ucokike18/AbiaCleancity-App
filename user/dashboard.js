/* =========================================================
   ABIA CLEANCITY
   RESIDENT DASHBOARD
   dashboard.js
========================================================= */

const USER_DATA_KEY = "abiaCleanCityUser";
const CURRENT_USER_KEY = "abiaCleanCityCurrentUser";

let currentUser = null;
let user = null;


/* =========================================================
   SESSION
========================================================= */

function redirectToLogin() {
    window.location.href = "../login.html";
}

function loadUserSession() {
    const currentUserData = localStorage.getItem(CURRENT_USER_KEY);
    const storedUserData = localStorage.getItem(USER_DATA_KEY);

    if (!currentUserData || !storedUserData) {
        redirectToLogin();
        return false;
    }

    try {
        currentUser = JSON.parse(currentUserData);
        user = JSON.parse(storedUserData);
    } catch (error) {
        console.error("Unable to read user session:", error);

        localStorage.removeItem(CURRENT_USER_KEY);

        redirectToLogin();
        return false;
    }

    if (
        !currentUser ||
        typeof currentUser !== "object" ||
        !user ||
        typeof user !== "object"
    ) {
        localStorage.removeItem(CURRENT_USER_KEY);

        redirectToLogin();
        return false;
    }

    return true;
}


/* =========================================================
   USER DATA
========================================================= */

function initializeUserData() {
    let changed = false;

    if (!Array.isArray(user.reports)) {
        user.reports = [];
        changed = true;
    }

    if (!Array.isArray(user.recyclingRequests)) {
        user.recyclingRequests = [];
        changed = true;
    }

    if (!Array.isArray(user.notifications)) {
        user.notifications = [];
        changed = true;
    }

    if (!user.collectionSchedule) {
        user.collectionSchedule = {
            date: getDefaultCollectionDate(),
            time: "8:00 AM - 12:00 PM",
            status: "Scheduled"
        };

        changed = true;
    }

    if (changed) {
        saveUser();
    }
}

function saveUser() {
    try {
        localStorage.setItem(
            USER_DATA_KEY,
            JSON.stringify(user)
        );

        return true;
    } catch (error) {
        console.error("Unable to save user data:", error);

        return false;
    }
}

function syncCurrentUserSession() {
    if (!currentUser || !user) {
        return;
    }

    currentUser.name =
        user.name ||
        currentUser.name ||
        "";

    currentUser.email =
        user.email ||
        currentUser.email ||
        "";

    try {
        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify(currentUser)
        );
    } catch (error) {
        console.error(
            "Unable to synchronize current user session:",
            error
        );
    }
}

function getDefaultCollectionDate() {
    const date = new Date();

    date.setDate(
        date.getDate() + 3
    );

    return date.toISOString();
}


/* =========================================================
   DISPLAY USER INFORMATION
========================================================= */

function displayUserInformation() {
    if (!user || !currentUser) {
        return;
    }

    const name =
        user.name ||
        currentUser.name ||
        "Resident";

    const email =
        user.email ||
        currentUser.email ||
        "-";

    const initial =
        name
            .trim()
            .charAt(0)
            .toUpperCase() || "R";

    setText(
        "welcomeName",
        getFirstName(name)
    );

    /*
        Header/profile initials
    */

    setText(
        "avatarInitial",
        initial
    );

    setText(
        "profileInitial",
        initial
    );

    setText(
        "profileDisplayName",
        name
    );

    setText(
        "userName",
        name
    );

    setText(
        "email",
        email
    );

    setText(
        "phone",
        user.phone || "-"
    );

    setText(
        "userAddress",
        user.address || "-"
    );

    setText(
        "building",
        formatValue(
            user.buildingType
        )
    );

    setText(
        "userType",
        formatValue(
            user.userType
        )
    );

    const paymentStatus =
        user.paymentStatus ||
        "Pending";

    setText(
        "paymentStatus",
        paymentStatus
    );

    setText(
        "overviewPaymentStatus",
        paymentStatus
    );

    updatePaymentButton(
        paymentStatus
    );
}


/* =========================================================
   DASHBOARD OVERVIEW
========================================================= */

function updateDashboardOverview() {
    if (!user) {
        return;
    }

    const reports =
        getUserReports();

    const recyclingRequests =
        getRecyclingRequests();

    setText(
        "overviewReports",
        reports.length
    );

    setText(
        "overviewRecycling",
        recyclingRequests.length
    );

    updateCollectionCard();

    renderRecentReports();

    renderRecentRecycling();

    renderAllReports();

    renderAllRecycling();

    renderNotifications();

    updateNotificationIndicator();
}


/* =========================================================
   COLLECTION
========================================================= */

function updateCollectionCard() {
    const schedule =
        user.collectionSchedule;

    if (!schedule) {
        setText(
            "overviewCollection",
            "Not scheduled"
        );

        return;
    }

    const collectionDate =
        formatDate(
            schedule.date
        );

    const collectionMonth =
        getMonth(
            schedule.date
        );

    const collectionDay =
        getDay(
            schedule.date
        );

    setText(
        "overviewCollection",
        collectionDate
    );

    setText(
        "collectionMonth",
        collectionMonth
    );

    setText(
        "collectionDay",
        collectionDay
    );

    setText(
        "collectionDate",
        collectionDate
    );

    setText(
        "collectionTime",
        schedule.time ||
        "Time to be announced"
    );

    setText(
        "scheduleFullDate",
        collectionDate
    );

    setText(
        "scheduleDate",
        collectionDate
    );

    setText(
        "scheduleTime",
        schedule.time ||
        "Time to be announced"
    );

    setText(
        "scheduleStatus",
        schedule.status ||
        "Scheduled"
    );

    const collectionStatus =
        document.getElementById(
            "collectionStatus"
        );

    if (collectionStatus) {
        collectionStatus.textContent =
            schedule.status ||
            "Scheduled";

        collectionStatus.className =
            `status-badge ${getStatusClass(
                schedule.status ||
                "Scheduled"
            )}`;
    }
}


/* =========================================================
   REPORTS
========================================================= */

function renderRecentReports() {
    const container =
        document.getElementById(
            "recentReports"
        );

    if (!container) {
        return;
    }

    const reports =
        getSortedReports()
            .slice(0, 3);

    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✓</div>

                <h4>No reports yet</h4>

                <p>
                    Waste reports you submit
                    will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        reports
            .map(createReportHTML)
            .join("");
}

function renderAllReports() {
    const container =
        document.getElementById(
            "allReports"
        );

    if (!container) {
        return;
    }

    const reports =
        getSortedReports();

    if (reports.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✓</div>

                <h4>No reports submitted</h4>

                <p>
                    Your submitted waste reports
                    will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        reports
            .map(createReportHTML)
            .join("");
}

function createReportHTML(report) {
    const status =
        report.status ||
        "Pending";

    return `
        <div class="activity-item">

            <div class="activity-icon report-activity-icon">
                ⚠
            </div>

            <div class="activity-content">

                <h4>
                    Waste Issue Report
                </h4>

                <p>
                    ${escapeHTML(
                        report.issue ||
                        "No description"
                    )}
                </p>

                <span class="activity-date">
                    ${escapeHTML(
                        formatDate(
                            report.createdAt
                        )
                    )}
                </span>

            </div>

            <span class="status-badge ${getStatusClass(status)}">
                ${escapeHTML(status)}
            </span>

        </div>
    `;
}


/* =========================================================
   RECYCLING
========================================================= */

function renderRecentRecycling() {
    const container =
        document.getElementById(
            "recentRecycling"
        );

    if (!container) {
        return;
    }

    const requests =
        getSortedRecyclingRequests()
            .slice(0, 3);

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">♻</div>

                <h4>
                    No recycling requests
                </h4>

                <p>
                    Your recycling submissions
                    will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        requests
            .map(createRecyclingHTML)
            .join("");
}

function renderAllRecycling() {
    const container =
        document.getElementById(
            "allRecycling"
        );

    if (!container) {
        return;
    }

    const requests =
        getSortedRecyclingRequests();

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">♻</div>

                <h4>
                    No recycling requests
                </h4>

                <p>
                    Your recycling submissions
                    will appear here.
                </p>
            </div>
        `;

        return;
    }

    container.innerHTML =
        requests
            .map(createRecyclingHTML)
            .join("");
}

function createRecyclingHTML(request) {
    const status =
        request.status ||
        "Pending";

    return `
        <div class="activity-item">

            <div class="activity-icon recycling-activity-icon">
                ♻
            </div>

            <div class="activity-content">

                <h4>
                    ${escapeHTML(
                        request.item ||
                        "Recyclable item"
                    )}
                </h4>

                <p>
                    Quantity:
                    ${escapeHTML(
                        request.quantity ||
                        "-"
                    )}
                </p>

                <span class="activity-date">
                    ${escapeHTML(
                        formatDate(
                            request.createdAt
                        )
                    )}
                </span>

            </div>

            <span class="status-badge ${getStatusClass(status)}">
                ${escapeHTML(status)}
            </span>

        </div>
    `;
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function getNotifications() {
    if (
        !user ||
        !Array.isArray(
            user.notifications
        )
    ) {
        return [];
    }

    return user.notifications;
}

function getUnreadNotifications() {
    return getNotifications().filter(
        notification =>
            notification &&
            notification.read !== true
    );
}

function toggleNotifications() {
    const panel =
        document.getElementById(
            "notificationsPanel"
        );

    const button =
        document.getElementById(
            "notificationButton"
        );

    if (!panel || !button) {
        return;
    }

    const isOpen =
        panel.classList.contains(
            "is-open"
        );

    if (isOpen) {
        closeNotifications();

        return;
    }

    renderNotifications();

    panel.classList.add(
        "is-open"
    );

    panel.setAttribute(
        "aria-hidden",
        "false"
    );

    button.setAttribute(
        "aria-expanded",
        "true"
    );
}

function closeNotifications() {
    const panel =
        document.getElementById(
            "notificationsPanel"
        );

    const button =
        document.getElementById(
            "notificationButton"
        );

    if (panel) {
        panel.classList.remove(
            "is-open"
        );

        panel.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    if (button) {
        button.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}

function updateNotificationIndicator() {
    const dot =
        document.getElementById(
            "notificationDot"
        );

    const unread =
        getUnreadNotifications()
            .length;

    if (!dot) {
        return;
    }

    dot.classList.toggle(
        "hidden",
        unread === 0
    );
}

function renderNotifications() {
    const list =
        document.getElementById(
            "notificationsList"
        );

    const summary =
        document.getElementById(
            "notificationSummary"
        );

    const markReadButton =
        document.getElementById(
            "markReadButton"
        );

    if (!list) {
        return;
    }

    const notifications =
        getNotifications()
            .slice()
            .sort(
                compareByCreatedDate
            );

    const unread =
        getUnreadNotifications()
            .length;

    if (summary) {
        summary.textContent =
            unread > 0
                ? `${unread} unread notification${unread === 1 ? "" : "s"}`
                : "No new notifications";
    }

    if (markReadButton) {
        markReadButton.style.visibility =
            unread > 0
                ? "visible"
                : "hidden";
    }

    /*
        Empty notification state
    */

    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="notification-empty">

                <div class="notification-empty-icon">
                    🔔
                </div>

                <h4>
                    No new notifications
                </h4>

                <p>
                    You're all caught up!
                </p>

            </div>
        `;

        updateNotificationIndicator();

        return;
    }

    list.innerHTML =
        notifications
            .map(
                createNotificationHTML
            )
            .join("");

    updateNotificationIndicator();
}

function createNotificationHTML(
    notification
) {
    const title =
        notification.title ||
        notification.message ||
        "Notification";

    const message =
        notification.message ||
        "";

    const type =
        String(
            notification.type ||
            "general"
        ).toLowerCase();

    const icon =
        type === "collection"
            ? "🗓"
            : type === "report"
                ? "⚠"
                : type === "recycling"
                    ? "♻"
                    : "🔔";

    const unreadClass =
        notification.read === true
            ? ""
            : " unread";

    return `
        <div class="notification-item${unreadClass}">

            <div class="notification-item-icon">
                ${icon}
            </div>

            <div class="notification-item-content">

                <h4>
                    ${escapeHTML(title)}
                </h4>

                ${
                    message
                        ? `<p>${escapeHTML(
                            message
                        )}</p>`
                        : ""
                }

                ${
                    notification.createdAt
                        ? `
                            <span class="notification-item-date">
                                ${escapeHTML(
                                    formatDate(
                                        notification.createdAt
                                    )
                                )}
                            </span>
                        `
                        : ""
                }

            </div>

        </div>
    `;
}

function markAllNotificationsRead() {
    const notifications =
        getNotifications();

    if (notifications.length === 0) {
        return;
    }

    notifications.forEach(
        notification => {
            notification.read = true;
        }
    );

    saveUser();

    renderNotifications();

    updateNotificationIndicator();
}

function addNotification({
    title,
    message,
    type = "general"
}) {
    if (
        !Array.isArray(
            user.notifications
        )
    ) {
        user.notifications = [];
    }

    user.notifications.push({
        id: Date.now(),
        title,
        message,
        type,
        read: false,
        createdAt:
            new Date().toISOString()
    });

    saveUser();

    renderNotifications();

    updateNotificationIndicator();
}


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(
    sectionId,
    clickedButton
) {
    const sections =
        document.querySelectorAll(
            ".dashboard-section"
        );

    sections.forEach(
        section => {
            section.classList.remove(
                "active-section"
            );
        }
    );

    const targetSection =
        document.getElementById(
            sectionId
        );

    if (targetSection) {
        targetSection.classList.add(
            "active-section"
        );
    }

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );

    navItems.forEach(
        item => {
            item.classList.remove(
                "active"
            );
        }
    );

    if (clickedButton) {
        clickedButton.classList.add(
            "active"
        );
    }

    closeMobileSidebar();

    closeNotifications();
}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleMobileSidebar() {
    toggleSidebar();
}

function toggleSidebar() {
    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (!sidebar || !overlay) {
        return;
    }

    sidebar.classList.toggle(
        "sidebar-open"
    );

    overlay.classList.toggle(
        "overlay-visible"
    );
}

function closeMobileSidebar() {
    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (sidebar) {
        sidebar.classList.remove(
            "sidebar-open"
        );
    }

    if (overlay) {
        overlay.classList.remove(
            "overlay-visible"
        );
    }
}


/* =========================================================
   PAYMENT
========================================================= */

function updatePaymentButton(status) {
    const button =
        document.getElementById(
            "payNowBtn"
        );

    if (!button) {
        return;
    }

    const isPaid =
        String(status)
            .toLowerCase() ===
        "paid";

    if (isPaid) {
        button.textContent =
            "Payment Completed";

        button.disabled = true;

        button.classList.add(
            "button-disabled"
        );
    } else {
        button.textContent =
            "Pay Now";

        button.disabled = false;

        button.classList.remove(
            "button-disabled"
        );
    }
}

function openPaymentModal() {
    const modal =
        document.getElementById(
            "paymentModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.add(
        "modal-visible"
    );
}

function closeModal() {
    const modal =
        document.getElementById(
            "paymentModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "modal-visible"
    );
}

function confirmPayment() {
    const cardNumberInput =
        document.getElementById(
            "cardNumber"
        );

    const expiryDateInput =
        document.getElementById(
            "expiryDate"
        );

    const cvvInput =
        document.getElementById(
            "cvv"
        );

    if (
        !cardNumberInput ||
        !expiryDateInput ||
        !cvvInput
    ) {
        return;
    }

    const cardNumber =
        cardNumberInput.value.trim();

    const expiryDate =
        expiryDateInput.value.trim();

    const cvv =
        cvvInput.value.trim();

    if (
        !cardNumber ||
        !expiryDate ||
        !cvv
    ) {
        alert(
            "Please complete all payment fields."
        );

        return;
    }

    /*
        Frontend demonstration only.
        No real payment is processed.
        Card information is never stored.
    */

    user.paymentStatus = "Paid";

    saveUser();

    setText(
        "paymentStatus",
        "Paid"
    );

    setText(
        "overviewPaymentStatus",
        "Paid"
    );

    updatePaymentButton(
        "Paid"
    );

    cardNumberInput.value = "";
    expiryDateInput.value = "";
    cvvInput.value = "";

    closeModal();

    alert(
        "Payment recorded successfully."
    );
}


/* =========================================================
   WASTE REPORT
========================================================= */

function submitIssue() {
    const issueInput =
        document.getElementById(
            "issue"
        );

    if (!issueInput) {
        return;
    }

    const issue =
        issueInput.value.trim();

    if (!issue) {
        alert(
            "Please describe the waste issue."
        );

        return;
    }

    if (
        !Array.isArray(
            user.reports
        )
    ) {
        user.reports = [];
    }

    const report = {
        id: Date.now(),
        issue,
        status: "Pending",
        createdAt:
            new Date().toISOString()
    };

    user.reports.push(
        report
    );

    saveUser();

    issueInput.value = "";

    updateDashboardOverview();

    /*
        Add an unread notification so the
        header bell immediately reflects
        the new activity.
    */

    addNotification({
        title:
            "Waste report submitted",

        message:
            "Your waste issue report has been received.",

        type: "report"
    });

    alert(
        "Your waste report has been submitted successfully."
    );

    showSection(
        "reports",
        document.querySelector(
            '.nav-item[onclick*="reports"]'
        )
    );
}


/* =========================================================
   RECYCLING
========================================================= */

function sellItem() {
    const itemInput =
        document.getElementById(
            "item"
        );

    const quantityInput =
        document.getElementById(
            "quantity"
        );

    if (
        !itemInput ||
        !quantityInput
    ) {
        return;
    }

    const item =
        itemInput.value.trim();

    const quantity =
        quantityInput.value.trim();

    if (
        !item ||
        !quantity
    ) {
        alert(
            "Please enter the recyclable item and quantity."
        );

        return;
    }

    if (
        !Array.isArray(
            user.recyclingRequests
        )
    ) {
        user.recyclingRequests = [];
    }

    const request = {
        id: Date.now(),
        item,
        quantity,
        status: "Pending",
        createdAt:
            new Date().toISOString()
    };

    user.recyclingRequests.push(
        request
    );

    saveUser();

    itemInput.value = "";
    quantityInput.value = "";

    updateDashboardOverview();

    addNotification({
        title:
            "Recycling request submitted",

        message:
            "Your recycling request has been received.",

        type: "recycling"
    });

    alert(
        "Your recycling request has been submitted successfully."
    );
}


/* =========================================================
   PROFILE
========================================================= */

function enableProfileEditing() {
    const profileView =
        document.getElementById(
            "profileView"
        );

    const profileForm =
        document.getElementById(
            "profileEditForm"
        );

    const editButton =
        document.getElementById(
            "editProfileBtn"
        );

    if (
        !profileView ||
        !profileForm
    ) {
        return;
    }

    setInputValue(
        "editName",
        user.name || ""
    );

    setInputValue(
        "editEmail",
        user.email || ""
    );

    setInputValue(
        "editPhone",
        user.phone || ""
    );

    setInputValue(
        "editAddress",
        user.address || ""
    );

    setInputValue(
        "editBuilding",
        user.buildingType || ""
    );

    setInputValue(
        "editUserType",
        user.userType || ""
    );

    clearProfileErrors();

    profileView.style.display =
        "none";

    profileForm.classList.add(
        "profile-form-visible"
    );

    if (editButton) {
        editButton.style.display =
            "none";
    }

    const nameInput =
        document.getElementById(
            "editName"
        );

    if (nameInput) {
        nameInput.focus();
    }
}

function cancelProfileEditing() {
    const profileView =
        document.getElementById(
            "profileView"
        );

    const profileForm =
        document.getElementById(
            "profileEditForm"
        );

    const editButton =
        document.getElementById(
            "editProfileBtn"
        );

    if (
        !profileView ||
        !profileForm
    ) {
        return;
    }

    profileForm.classList.remove(
        "profile-form-visible"
    );

    profileView.style.display =
        "";

    if (editButton) {
        editButton.style.display =
            "inline-flex";
    }

    clearProfileErrors();
}

function saveProfileChanges(event) {
    if (event) {
        event.preventDefault();
    }

    clearProfileErrors();

    const name =
        getInputValue(
            "editName"
        );

    const email =
        getInputValue(
            "editEmail"
        );

    const phone =
        getInputValue(
            "editPhone"
        );

    const address =
        getInputValue(
            "editAddress"
        );

    const buildingType =
        getInputValue(
            "editBuilding"
        );

    const userType =
        getInputValue(
            "editUserType"
        );

    let isValid = true;

    if (name.length < 2) {
        showProfileError(
            "nameError",
            "Please enter your full name."
        );

        isValid = false;
    }

    if (!isValidPhone(phone)) {
        showProfileError(
            "phoneError",
            "Please enter a valid phone number."
        );

        isValid = false;
    }

    if (address.length < 5) {
        showProfileError(
            "addressError",
            "Please enter your residential address."
        );

        isValid = false;
    }

    if (!isValid) {
        return;
    }

    user.name =
        name;

    user.email =
        email;

    user.phone =
        phone;

    user.address =
        address;

    user.buildingType =
        buildingType;

    user.userType =
        userType;

    if (!saveUser()) {
        alert(
            "Unable to save your profile changes. Please try again."
        );

        return;
    }

    syncCurrentUserSession();

    displayUserInformation();

    updateDashboardOverview();

    cancelProfileEditing();

    alert(
        "Your profile has been updated successfully."
    );
}

function isValidPhone(phone) {
    const digits =
        String(phone || "")
            .replace(
                /\D/g,
                ""
            );

    return (
        digits.length >= 10 &&
        digits.length <= 15
    );
}

function showProfileError(
    elementId,
    message
) {
    const element =
        document.getElementById(
            elementId
        );

    if (element) {
        element.textContent =
            message;
    }
}

function clearProfileErrors() {
    document
        .querySelectorAll(
            ".field-error"
        )
        .forEach(
            error => {
                error.textContent =
                    "";
            }
        );
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {
    const confirmed =
        confirm(
            "Are you sure you want to logout?"
        );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem(
        CURRENT_USER_KEY
    );

    window.location.href =
        "../login.html";
}


/* =========================================================
   DATA HELPERS
========================================================= */

function getUserReports() {
    return Array.isArray(
        user?.reports
    )
        ? user.reports
        : [];
}

function getRecyclingRequests() {
    return Array.isArray(
        user?.recyclingRequests
    )
        ? user.recyclingRequests
        : [];
}

function getSortedReports() {
    return [
        ...getUserReports()
    ].sort(
        compareByCreatedDate
    );
}

function getSortedRecyclingRequests() {
    return [
        ...getRecyclingRequests()
    ].sort(
        compareByCreatedDate
    );
}

function compareByCreatedDate(
    a,
    b
) {
    const dateA =
        new Date(
            a?.createdAt || 0
        ).getTime();

    const dateB =
        new Date(
            b?.createdAt || 0
        ).getTime();

    return dateB - dateA;
}


/* =========================================================
   UTILITY FUNCTIONS
========================================================= */

function setText(
    id,
    value
) {
    const element =
        document.getElementById(
            id
        );

    if (element) {
        element.textContent =
            value ?? "-";
    }
}

function getInputValue(id) {
    const element =
        document.getElementById(
            id
        );

    if (!element) {
        return "";
    }

    return String(
        element.value || ""
    ).trim();
}

function setInputValue(
    id,
    value
) {
    const element =
        document.getElementById(
            id
        );

    if (element) {
        element.value =
            value ?? "";
    }
}

function getFirstName(name) {
    if (!name) {
        return "Resident";
    }

    return String(name)
        .trim()
        .split(/\s+/)[0];
}

function formatValue(value) {
    if (!value) {
        return "-";
    }

    return String(value)
        .replace(
            /([A-Z])/g,
            " $1"
        )
        .replace(
            /^./,
            letter =>
                letter.toUpperCase()
        );
}

function formatDate(
    dateValue
) {
    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(
            dateValue
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return date.toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

function getMonth(
    dateValue
) {
    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(
            dateValue
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return date
        .toLocaleDateString(
            "en-NG",
            {
                month: "short"
            }
        )
        .toUpperCase();
}

function getDay(
    dateValue
) {
    if (!dateValue) {
        return "-";
    }

    const date =
        new Date(
            dateValue
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }

    return date.getDate();
}

function getStatusClass(
    status
) {
    const normalized =
        String(status || "")
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );

    if (
        normalized === "resolved" ||
        normalized === "completed" ||
        normalized === "paid"
    ) {
        return "status-success";
    }

    if (
        normalized === "in-progress" ||
        normalized === "processing"
    ) {
        return "status-progress";
    }

    if (
        normalized === "scheduled"
    ) {
        return "scheduled";
    }

    return "status-pending";
}

function escapeHTML(
    value
) {
    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   GLOBAL CLICK / KEYBOARD HANDLERS
========================================================= */

window.addEventListener(
    "click",
    event => {
        const wrapper =
            document.querySelector(
                ".notification-wrapper"
            );

        if (
            wrapper &&
            !wrapper.contains(
                event.target
            )
        ) {
            closeNotifications();
        }

        const modal =
            document.getElementById(
                "paymentModal"
            );

        if (
            modal &&
            event.target === modal
        ) {
            closeModal();
        }
    }
);

window.addEventListener(
    "keydown",
    event => {
        if (
            event.key ===
            "Escape"
        ) {
            closeNotifications();
            closeModal();
        }
    }
);


/* =========================================================
   INITIALIZE
========================================================= */

function initializeDashboard() {
    if (!loadUserSession()) {
        return;
    }

    initializeUserData();

    displayUserInformation();

    updateDashboardOverview();
}

initializeDashboard();