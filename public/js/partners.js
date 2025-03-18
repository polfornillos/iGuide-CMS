//Initialize News DataTable
$(document).ready(function() {
    $('#partnersTable').DataTable({
        paging: false,  // Remove pagination
        info: false,    // Remove "Showing X of X entries"
        searching: false, // Remove search bar
        lengthChange: false, // Remove "Show entries" dropdown
        ordering: false
    });
});

// Custom Search Function
document.getElementById("searchInput").addEventListener("keyup", function () {
    let filter = this.value.toLowerCase();
    let rows = document.querySelectorAll("#partnersTable tbody tr");

    rows.forEach(row => {
        let text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
});

// Updates image preview when a file is selected
document.getElementById("partnerLogo").addEventListener("change", function (event) {
    const imagePreview = document.getElementById("imagePreview");
    const imagePlaceholder = document.getElementById("imagePlaceholder");
    
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove("d-none");
            imagePlaceholder.style.display = "none"; // Hide text
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.src = "";
        imagePreview.classList.add("d-none");
        imagePlaceholder.style.display = "block"; // Show text
    }
});

// Add Partner
document.getElementById("submitPartner").addEventListener("click", function () {
    let companyName = document.getElementById("partnerName").value.trim();
    let companyLink = document.getElementById("partnerLink").value.trim();
    let companyLogo = document.getElementById("partnerLogo").files[0];

    // Check if fields are empty
    if (!companyName || !companyLogo) {
        Swal.fire({
            title: "Warning!",
            text: "All fields are required.",
            icon: "warning",
            iconColor: "#f39c12",
            confirmButtonColor: "#6c757d"
        });
        return; // Stop execution if fields are empty
    }

    let formData = new FormData();
    formData.append("company_name", companyName);
    formData.append("company_logo", companyLogo);
    formData.append("company_link", companyLink);

    fetch("http://localhost:5000/partners/upload", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: "Partner has been added successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                location.reload();
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: "Error!",
            text: "Failed to add partner. Please try again.",
            icon: "error",
            iconColor: "#d33",
            confirmButtonColor: "#10326F"
        });
        console.error("Error:", error);
    });
});

// Fetch and display partners
function fetchPartners() {
    fetch("http://localhost:5000/partners")
        .then(response => response.json())
        .then(partners => {
            let partnersTableBody = document.querySelector("#partnersTable tbody");
            partnersTableBody.innerHTML = "";

            partners.forEach(item => {
                let statusPill = item.isDeleted === 1 
                    ? '<span class="badge rounded-pill bg-secondary px-4 py-2" style="font-size:15px">Archived</span>' 
                    : '<span class="badge rounded-pill bg-success px-4 py-2"  style="font-size:15px">Active</span>';

                // Check if the link is available, if not, set it to 'N/A'
                let partnerLink = item.company_link ? `<a href="${item.company_link}" target="_blank">${item.company_name}</a>` : 'N/A';

                let row = `<tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>${item.company_name}</td>
                    <td><img src="${item.company_logo}" width="50"></td>
                    <td>${partnerLink}</td>
                    <td>${new Date(item.upload_date).toLocaleDateString("en-US", { 
                        year: "numeric", 
                        month: "long", 
                        day: "2-digit" 
                    })}</td>                    
                    <td class="text-center">${statusPill}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${item.id}" data-bs-toggle="modal" data-bs-target="#editPartnerModal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm ${item.isDeleted === 1 ? "btn-success" : "btn-secondary"} archive-btn" data-id="${item.id}" data-isDeleted="${item.isDeleted}">
                            ${item.isDeleted === 1 ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-box"></i>'}
                        </button>
                          <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}" ${item.isDeleted === 0 ? "disabled" : ""}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
                partnersTableBody.innerHTML += row;
            });

            attachDeleteEvents();
            attachArchiveEvents();
            attachEditEvents();
        })
        .catch(error => console.error("Error fetching partners:", error));
}

// Delete partner based on ID
function attachDeleteEvents() {
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", function () {
            let partnerId = this.getAttribute("data-id");

            // SweetAlert2 Confirmation Dialog
            Swal.fire({
                title: "Are you sure?",
                text: "This partner will be permanently deleted!",
                icon: "warning",
                iconColor: "#dc3545",
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Yes, delete it!"
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch(`http://localhost:5000/partners/${partnerId}`, { method: "DELETE" })
                        .then(response => response.json())
                        .then(data => {
                            // SweetAlert2 Success Message
                            Swal.fire({
                                title: "Deleted!",
                                text: "Partner has been deleted.",
                                icon: "success",
                                timer: 1500,
                                showConfirmButton: false
                            });
                            fetchPartners(); // Refresh table after deletion
                        })
                        .catch(error => console.error("Error deleting partner:", error));
                }
            });
        });
    });
}

// Archive or restore partner
function attachArchiveEvents() {
    document.querySelectorAll(".archive-btn").forEach(button => {
        button.addEventListener("click", function () {
            let partnerId = this.getAttribute("data-id");
            let currentStatus = this.getAttribute("data-isDeleted");

            let newStatus = currentStatus === "1" ? 0 : 1;

            fetch(`http://localhost:5000/partners/${partnerId}/archive`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDeleted: newStatus })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    Swal.fire({
                        title: "Success!",
                        text: `Partner has been ${newStatus === 1 ? "archived" : "restored"}.`,
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        fetchPartners(); // Refresh partners list
                    });
                }
            })
            .catch(error => {
                Swal.fire({
                    title: "Error!",
                    text: "Failed to update status. Please try again.",
                    icon: "error",
                    iconColor: "#d33",
                    confirmButtonColor: "#10326F"
                });
                console.error("Error:", error);
            });
        });
    });
}

// Populate the fields in Edit Partner
function attachEditEvents() {
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", function () {
            let partnerId = this.getAttribute("data-id");
            fetch(`http://localhost:5000/partners/${partnerId}`)
                .then(response => response.json())
                .then(partner => {
                    document.getElementById("editPartnerId").value = partner.id;
                    document.getElementById("editPartnerName").value = partner.company_name;
                    document.getElementById("editPartnerLink").value = partner.company_link;

                    
                    let imagePreview = document.getElementById("editImagePreview");
                    let imagePlaceholder = document.getElementById("editImagePlaceholder");

                    if (partner.company_logo) {
                        imagePreview.src = partner.company_logo;
                        imagePreview.classList.remove("d-none");
                        imagePlaceholder.style.display = "none";
                    } else {
                        imagePreview.src = "";
                        imagePreview.classList.add("d-none");
                        imagePlaceholder.style.display = "block";
                    }
                })
                .catch(error => console.error("Error fetching partner details:", error));
        });
    });
}

// Edit Partner Image Preview
document.getElementById("editPartnerLogo").addEventListener("change", function (event) {
    const imagePreview = document.getElementById("editImagePreview");
    const imagePlaceholder = document.getElementById("editImagePlaceholder");

    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove("d-none");
            imagePlaceholder.style.display = "none";
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.src = "";
        imagePreview.classList.add("d-none");
        imagePlaceholder.style.display = "block";
    }
});

// Saves the changes in Edit Partner
document.getElementById("savePartnerChanges").addEventListener("click", function () {
    let partnerId = document.getElementById("editPartnerId").value;
    let partnerName = document.getElementById("editPartnerName").value.trim();
    let partnerLink = document.getElementById("editPartnerLink").value.trim();

    // Validation
    if (!partnerName) {
        Swal.fire({
            title: "Warning!",
            text: "Please enter the company name.",
            icon: "warning",
            confirmButtonColor: "#6c757d"
        });
        return;
    }

    let formData = new FormData();
    formData.append("company_name", partnerName);
    formData.append("company_link", partnerLink);

    let imageFile = document.getElementById("editPartnerLogo").files[0];
    if (imageFile) {
        formData.append("company_logo", imageFile);
    }

    fetch(`http://localhost:5000/partners/${partnerId}`, {
        method: "PUT",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: "Partner has been updated successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                fetchPartners();
                document.getElementById("editPartnerModal").querySelector(".btn-close").click();
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: "Error!",
            text: "Failed to update partner. Please try again.",
            icon: "error",
            iconColor: "#d33",
            confirmButtonColor: "#10326F"
        });
        console.error("Error updating partner:", error);
    });
});

// Call fetchPartners() when the page loads
document.addEventListener("DOMContentLoaded", fetchPartners());

