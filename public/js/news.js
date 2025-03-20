//Initialize News DataTable
$(document).ready(function() {
    $('#newsTable').DataTable({
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
    let rows = document.querySelectorAll("#newsTable tbody tr");

    rows.forEach(row => {
        let text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
});

// Updates image preview when a file is selected
document.getElementById("newsImage").addEventListener("change", function (event) {
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

// Fetch and display news
function fetchNews() {
    fetch("http://localhost:5000/news")
        .then(response => response.json())
        .then(news => {
            let newsTableBody = document.querySelector("#newsTable tbody");
            newsTableBody.innerHTML = "";

            news.forEach(item => {
                let statusPill = item.isDeleted === 1 
                    ? '<span class="badge rounded-pill bg-secondary px-4 py-2" style="font-size:15px">Archived</span>' 
                    : '<span class="badge rounded-pill bg-success px-4 py-2"  style="font-size:15px">Active</span>';
                let row = `<tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>${item.title}</td>
                    <td><img src="${item.thumbnail}" width="50"></td>
                    <td>${item.description}</td>
                    <td>${new Date(item.upload_date).toLocaleDateString("en-US", { 
                        year: "numeric", 
                        month: "long", 
                        day: "2-digit" 
                    })}</td>                    
                    <td class="text-center">${statusPill}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning edit-btn my-1" data-id="${item.id}" data-bs-toggle="modal" data-bs-target="#editNewsModal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm ${item.isDeleted === 1 ? "btn-success" : "btn-secondary"} archive-btn my-1" data-id="${item.id}" data-isDeleted="${item.isDeleted}">
                            ${item.isDeleted === 1 ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-box"></i>'}
                        </button>
                          <button class="btn btn-sm btn-danger delete-btn my-1" data-id="${item.id}" ${item.isDeleted === 0 ? "disabled" : ""}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
                newsTableBody.innerHTML += row;
            });

            attachEditEvents();
            attachDeleteEvents();
            attachArchiveEvents();
        })
        .catch(error => console.error("Error fetching news:", error));
}

// Delete news based on ID
function attachDeleteEvents() {
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", function () {
            let newsId = this.getAttribute("data-id");

            // SweetAlert2 Confirmation Dialog
            Swal.fire({
                title: "Are you sure?",
                text: "This news item will be permanently deleted!",
                icon: "warning",
                iconColor:"#dc3545",
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Yes, delete it!"
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch(`http://localhost:5000/news/${newsId}`, { method: "DELETE" })
                        .then(response => response.json())
                        .then(data => {
                            // SweetAlert2 Success Message
                            Swal.fire({
                                title: "Deleted!",
                                text: "News item has been deleted.",
                                icon: "success",
                                timer: 1500,
                                showConfirmButton: false
                            });
                            fetchNews(); // Refresh table after deletion
                        })
                        .catch(error => console.error("Error deleting news:", error));
                }
            });
        });
    });
}

// Archives the news
function attachArchiveEvents() {
    document.querySelectorAll(".archive-btn").forEach(button => {
        button.addEventListener("click", function () {
            let newsId = this.getAttribute("data-id");
            let currentStatus = this.getAttribute("data-isDeleted");

            let newStatus = currentStatus === "1" ? 0 : 1;

            fetch(`http://localhost:5000/news/${newsId}/archive`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDeleted: newStatus })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    Swal.fire({
                        title: "Success!",
                        text: `News has been ${newStatus === 1 ? "archived" : "restored"}.`,
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        fetchNews(); // Refresh news list
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

// Populate the fields in Edit News
function attachEditEvents() {
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", function () {
            let newsId = this.getAttribute("data-id");
            fetch(`http://localhost:5000/news/${newsId}`)
                .then(response => response.json())
                .then(news => {
                    document.getElementById("editNewsId").value = news.id;
                    document.getElementById("editNewsTitle").value = news.title;
                    document.getElementById("editNewsDescription").value = news.description;

                    let imagePreview = document.getElementById("editImagePreview");
                    let imagePlaceholder = document.getElementById("editImagePlaceholder");

                    if (news.thumbnail) {
                        imagePreview.src = news.thumbnail;
                        imagePreview.classList.remove("d-none");
                        imagePlaceholder.style.display = "none";
                    } else {
                        imagePreview.src = "";
                        imagePreview.classList.add("d-none");
                        imagePlaceholder.style.display = "block";
                    }
                })
                .catch(error => console.error("Error fetching news details:", error));
        });
    });
}

// Edit News Image Preview
document.getElementById("editNewsImage").addEventListener("change", function (event) {
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

document.addEventListener("DOMContentLoaded", function () {
    // Add News Event
    document.getElementById("submitNews").addEventListener("click", function () {
        handleNewsSubmission("add");
    });

    // Edit News Event
    document.getElementById("saveNewsChanges").addEventListener("click", function () {
        handleNewsSubmission("edit");
    });

    // Remove error messages when typing or selecting a file
    document.getElementById("newsTitle").addEventListener("input", function () {
        clearError(this);
    });
    document.getElementById("newsDescription").addEventListener("input", function () {
        clearError(this);
    });
    document.getElementById("newsImage").addEventListener("change", function () {
        clearError(this);
    });

    document.getElementById("editNewsTitle").addEventListener("input", function () {
        clearError(this);
    });
    document.getElementById("editNewsDescription").addEventListener("input", function () {
        clearError(this);
    });
    document.getElementById("editNewsImage").addEventListener("change", function () {
        clearError(this);
    });
});

// Function to handle both Add & Edit News
function handleNewsSubmission(action) {
    let isEdit = action === "edit";
    let newsId = isEdit ? document.getElementById("editNewsId").value : null;

    let inputElements = [
        { element: document.getElementById(isEdit ? "editNewsTitle" : "newsTitle"), id: isEdit ? "editNewsTitle" : "newsTitle" },
        { element: document.getElementById(isEdit ? "editNewsDescription" : "newsDescription"), id: isEdit ? "editNewsDescription" : "newsDescription" },
        { element: document.getElementById(isEdit ? "editNewsImage" : "newsImage"), id: isEdit ? "editNewsImage" : "newsImage", required: !isEdit }
    ];

    let isValid = true;

    // Clear previous errors
    inputElements.forEach(({ id }) => clearError(document.getElementById(id)));

    // Validation
    inputElements.forEach(({ element, id, required = true }) => {
        if (required && (!element.value || (element.files && element.files.length === 0))) {
            showError(document.getElementById(id), "This field is required.");
            isValid = false;
        }
    });

    if (!isValid) return; // Stop execution if validation fails

    let formData = new FormData();
    formData.append("title", inputElements[0].element.value.trim());
    formData.append("description", inputElements[1].element.value.trim());
    if (inputElements[2].element.files[0]) formData.append("thumbnail", inputElements[2].element.files[0]);

    let url = isEdit ? `http://localhost:5000/news/${newsId}` : "http://localhost:5000/news/upload";
    let method = isEdit ? "PUT" : "POST";

    fetch(url, { method, body: formData })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: isEdit ? "News has been updated successfully." : "News has been added successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                fetchNews();
                if (isEdit) document.getElementById("editNewsModal").querySelector(".btn-close").click();
                else location.reload();
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: "Error!",
            text: isEdit ? "Failed to update news. Please try again." : "Failed to add news. Please try again.",
            icon: "error",
            iconColor: "#d33",
            confirmButtonColor: "#10326F"
        });
        console.error("Error:", error);
    });
}

// Function to show error messages
function showError(inputElement, message) {
    inputElement.classList.add("is-invalid");

    let errorMessage = document.createElement("div");
    errorMessage.className = "error-message text-danger mt-1";
    errorMessage.innerText = message;

    inputElement.parentNode.appendChild(errorMessage);
}

// Function to clear error messages dynamically
function clearError(inputElement) {
    inputElement.classList.remove("is-invalid");
    let errorMessage = inputElement.parentNode.querySelector(".error-message");
    if (errorMessage) errorMessage.remove();
}


// Call fetchNews() when the page loads
document.addEventListener("DOMContentLoaded", fetchNews);

