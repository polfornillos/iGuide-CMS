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

// Add news
document.getElementById("submitNews").addEventListener("click", function () {
    let title = document.getElementById("newsTitle").value.trim();
    let description = document.getElementById("newsDescription").value.trim();
    let image = document.getElementById("newsImage").files[0];

    // Check if fields are empty
    if (!title || !description || !image) {
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
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thumbnail", image);

    fetch("http://localhost:5000/news/upload", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: "News has been added successfully.",
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
            text: "Failed to add news. Please try again.",
            icon: "error",
            iconColor: "#d33",
            confirmButtonColor: "#10326F"
        });
        console.error("Error:", error);
    });
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
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${item.id}" data-bs-toggle="modal" data-bs-target="#editNewsModal">
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

// Saves the changes in Edit News
document.getElementById("saveNewsChanges").addEventListener("click", function () {
    let newsId = document.getElementById("editNewsId").value;
    let newsTitle = document.getElementById("editNewsTitle").value.trim();
    let newsDescription = document.getElementById("editNewsDescription").value.trim();

    // Validation
    if (!newsTitle || !newsDescription) {
        Swal.fire({
            title: "Warning!",
            text: "Please fill in both the news title and description.",
            icon: "warning",
            confirmButtonColor: "#6c757d"
        });
        return;
    }

    let formData = new FormData();
    formData.append("title", newsTitle);
    formData.append("description", newsDescription);

    let imageFile = document.getElementById("editNewsImage").files[0];
    if (imageFile) {
        formData.append("thumbnail", imageFile);
    }

    fetch(`http://localhost:5000/news/${newsId}`, {
        method: "PUT",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: "News has been updated successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                fetchNews();
                document.getElementById("editNewsModal").querySelector(".btn-close").click();
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: "Error!",
            text: "Failed to update news. Please try again.",
            icon: "error",
            iconColor: "#d33",
            confirmButtonColor: "#10326F"
        });
        console.error("Error updating news:", error);
    });
});

// Call fetchNews() when the page loads
document.addEventListener("DOMContentLoaded", fetchNews);

