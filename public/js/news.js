//========================================================================================================================================================================
// Manage News Section
//========================================================================================================================================================================

//Initialize News DataTable
$(document).ready(function() {
    $('#newsTable').DataTable({
        paging: false,  // Remove pagination
        info: false,    // Remove "Showing X of X entries"
        searching: false, // Remove search bar
        lengthChange: false // Remove "Show entries" dropdown
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
            confirmButtonColor: "#10326F"
        });
        return; // Stop execution if fields are empty
    }

    let formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("thumbnail", image);

    fetch("http://localhost:5000/upload", {
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
                let row = `<tr data-id="${item.id}" data-title="${item.title}" data-description="${item.description}" data-thumbnail="${item.thumbnail}">
                    <td>${item.id}</td>
                    <td>${item.title}</td>
                    <td><img src="${item.thumbnail}" width="50"></td>
                    <td>${new Date().toISOString().split("T")[0]}</td>
                    <td>
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${item.id}" data-bs-toggle="modal" data-bs-target="#editNewsModal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
                newsTableBody.innerHTML += row;
            });

            attachEditEvents();  // Attach edit button event listener
            attachDeleteEvents(); // Attach delete button event listener
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
    let formData = new FormData();
    formData.append("title", document.getElementById("editNewsTitle").value);
    formData.append("description", document.getElementById("editNewsDescription").value);

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

