//Initialize News DataTable
$(document).ready(function() {
    $('#galleryTable').DataTable({
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
    let rows = document.querySelectorAll("#galleryTable tbody tr");

    rows.forEach(row => {
        let text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
});

// Updates image preview when a file is selected
document.getElementById("galleryForm").addEventListener("change", function (event) {
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

// Add artwork
document.getElementById("submitGallery").addEventListener("click", function () {
    let title = document.getElementById("galleryTitle").value.trim();
    let studentName = document.getElementById("studentName").value.trim();
    let facebookLink = document.getElementById("facebookLink").value.trim();
    let twitterLink = document.getElementById("twitterLink").value.trim();
    let instagramLink = document.getElementById("instagramLink").value.trim();
    let image = document.getElementById("galleryImage").files[0];

    if (!title || !studentName || !image) {
        Swal.fire({
            title: "Warning!",
            text: "Title, Student Name, and an Image are required.",
            icon: "warning",
            iconColor: "#f39c12",
            confirmButtonColor: "#6c757d"
        });
        return;
    }

    let formData = new FormData();
    formData.append("title", title);
    formData.append("student_name", studentName);
    formData.append("artwork", image);
    formData.append("facebook_link", facebookLink);
    formData.append("twitter_link", twitterLink);
    formData.append("instagram_link", instagramLink);

    fetch("http://localhost:5000/artworks/upload", { // FIXED: Correct API route
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: "Gallery item has been added successfully.",
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
            text: "Failed to add gallery item. Please try again.",
            icon: "error",
            iconColor: "#d33",
            confirmButtonColor: "#10326F"
        });
        console.error("Error:", error);
    });
});

// Fetch and display artworks
function fetchArtworks() {
    fetch("http://localhost:5000/artworks")
        .then(response => response.json())
        .then(artworks => {
            let galleryTableBody = document.querySelector("#galleryTable tbody");
            galleryTableBody.innerHTML = "";

            artworks.forEach(item => {
                let statusPill = item.isDeleted === 1   
                    ? '<span class="badge rounded-pill bg-secondary px-4 py-2" style="font-size:15px">Archived</span>'
                    : '<span class="badge rounded-pill bg-success px-4 py-2" style="font-size:15px">Active</span>';

                // Check if the link is available, if not, set it to 'N/A'
                let facebookLink = item.facebook_link ? `<a href="${item.facebook_link}" target="_blank">Facebook</a>` : 'N/A';
                let twitterLink = item.twitter_link ? `<a href="${item.twitter_link}" target="_blank">Twitter</a>` : 'N/A';
                let instagramLink = item.instagram_link ? `<a href="${item.instagram_link}" target="_blank">Instagram</a>` : 'N/A';

                let row = `<tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>${item.title}</td>
                    <td>${item.student_name}</td>
                    <td><img src="${item.artwork}" width="50"></td>
                    <td>${facebookLink}</td>
                    <td>${twitterLink}</td>
                    <td>${instagramLink}</td>
                    <td>${new Date(item.upload_date).toLocaleDateString("en-US", { 
                        year: "numeric", 
                        month: "long", 
                        day: "2-digit" 
                    })}</td>
                    <td class="text-center">${statusPill}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${item.id}" data-bs-toggle="modal" data-bs-target="#editArtworkModal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn btn-sm ${item.isDeleted === 1 ? "btn-success" : "btn-secondary"} archive-btn" data-id="${item.id}" data-isDeleted="${item.isDeleted}">
                            ${item.isDeleted === 1 ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-box"></i>'}
                        </button>
                    </td>
                </tr>`;
                galleryTableBody.innerHTML += row;
            });

            attachDeleteEvents();
            attachArchiveEvents();
            attachEditEvents();
        })
        .catch(error => console.error("Error fetching artworks:", error));
}

// Delete artwork based on ID
function attachDeleteEvents() {
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", function () {
            let artworkId = this.getAttribute("data-id");

            // SweetAlert2 Confirmation Dialog
            Swal.fire({
                title: "Are you sure?",
                text: "This artwork will be permanently deleted!",
                icon: "warning",
                iconColor: "#dc3545",
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Yes, delete it!"
            }).then((result) => {
                if (result.isConfirmed) {
                    // Send DELETE request to the server
                    fetch(`http://localhost:5000/artworks/${artworkId}`, {method: "DELETE"})
                    .then(response => response.json())
                    .then(data => {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Artwork has been deleted.",
                            icon: "success",
                            timer: 1500,
                            showConfirmButton: false
                        });
                        fetchArtworks();
                    })
                    .catch(error => {
                        console.error("Error deleting artwork:", error);
                        Swal.fire({
                            title: "Error!",
                            text: "There was an issue deleting the artwork.",
                            icon: "error"
                        });
                    });
                }
            });
        });
    });
}

// Archives the artwork
function attachArchiveEvents() {
    document.querySelectorAll(".archive-btn").forEach(button => {
        button.addEventListener("click", function () {
            let newsId = this.getAttribute("data-id");
            let currentStatus = this.getAttribute("data-isDeleted");
            let newStatus = currentStatus === "1" ? 0 : 1;

            fetch(`http://localhost:5000/artworks/${newsId}/archive`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDeleted: newStatus })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    Swal.fire({
                        title: "Success!",
                        text: `Artwork has been ${newStatus === 1 ? "archived" : "restored"}.`,
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        fetchArtworks(); // Refresh news list
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

// Populate the fields in Edit Artwork
function attachEditEvents() {
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", function () {
            let artworkId = this.getAttribute("data-id");
            fetch(`http://localhost:5000/artworks/${artworkId}`)
                .then(response => response.json())
                .then(artwork => {
                    document.getElementById("editArtworkId").value = artwork.id;
                    document.getElementById("editArtworkTitle").value = artwork.title;
                    document.getElementById("editArtworkStudentName").value = artwork.student_name;
                    document.getElementById("editArtworkFacebookLink").value = artwork.facebook_link;
                    document.getElementById("editArtworkTwitterLink").value = artwork.twitter_link;
                    document.getElementById("editArtworkInstagramLink").value = artwork.instagram_link;

                    let imagePreview = document.getElementById("editArtworkPreview");
                    let imagePlaceholder = document.getElementById("editArtworkPlaceholder");

                    if (artwork.artwork) {
                        imagePreview.src = artwork.artwork;
                        imagePreview.classList.remove("d-none");
                        imagePlaceholder.style.display = "none";
                    } else {
                        imagePreview.src = "";
                        imagePreview.classList.add("d-none");
                        imagePlaceholder.style.display = "block";
                    }
                })
                .catch(error => console.error("Error fetching artwork details:", error));
        });
    });
}

// Edit Artwork Image Preview
document.getElementById("editArtworkImage").addEventListener("change", function (event) {
    const imagePreview = document.getElementById("editArtworkPreview");
    const imagePlaceholder = document.getElementById("editArtworkPlaceholder");

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

// Saves the changes in Edit Artwork
document.getElementById("saveArtworkChanges").addEventListener("click", function () {
    let artworkId = document.getElementById("editArtworkId").value;
    let artworkTitle = document.getElementById("editArtworkTitle").value.trim();
    let studentName = document.getElementById("editArtworkStudentName").value.trim();
    let facebookLink = document.getElementById("editArtworkFacebookLink").value.trim();
    let twitterLink = document.getElementById("editArtworkTwitterLink").value.trim();
    let instagramLink = document.getElementById("editArtworkInstagramLink").value.trim();

    // Validation
    if (!artworkTitle || !studentName) {
        Swal.fire({
            title: "Warning!",
            text: "Please fill in all the required fields (title, student name).",
            icon: "warning",
            confirmButtonColor: "#6c757d"
        });
        return;
    }

    let formData = new FormData();
    formData.append("title", artworkTitle);
    formData.append("student_name", studentName);
    formData.append("facebook_link", facebookLink);
    formData.append("twitter_link", twitterLink);
    formData.append("instagram_link", instagramLink);

    let imageFile = document.getElementById("editArtworkImage").files[0];
    if (imageFile) {
        formData.append("artwork", imageFile);
    }

    fetch(`http://localhost:5000/artworks/${artworkId}`, {
        method: "PUT",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: "Artwork has been updated successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                fetchArtworks(); // Assuming fetchArtworks is your function to refresh the artwork list
                document.getElementById("editArtworkModal").querySelector(".btn-close").click();
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: "Error!",
            text: "Failed to update artwork. Please try again.",
            icon: "error",
            iconColor: "#d33",
            confirmButtonColor: "#10326F"
        });
        console.error("Error updating artwork:", error);
    });
});


// Call fetchNews() when the page loads
document.addEventListener("DOMContentLoaded", fetchArtworks);

