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
document.getElementById("artworkForm").addEventListener("change", function (event) {
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
                        <button class="btn btn-sm btn-warning edit-btn my-1" data-id="${item.id}" data-bs-toggle="modal" data-bs-target="#editArtworkModal">
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

document.addEventListener("DOMContentLoaded", function () {
    // Add Artwork Event
    document.getElementById("submitArtwork").addEventListener("click", function () {
        handleArtworkSubmission("add");
    });

    // Edit Artwork Event
    document.getElementById("saveArtworkChanges").addEventListener("click", function () {
        handleArtworkSubmission("edit");
    });

    // Remove error messages when typing or selecting a file
    let fields = ["artworkTitle", "studentName", "facebookLink", "twitterLink", "instagramLink", "artworkImage",
                  "editArtworkTitle", "editArtworkStudentName", "editArtworkFacebookLink", "editArtworkTwitterLink",
                  "editArtworkInstagramLink", "editArtworkImage"];

    fields.forEach(id => {
        let input = document.getElementById(id);
        if (input) {
            input.addEventListener("input", function () {
                clearError(this);
            });
            if (input.type === "file") {
                input.addEventListener("change", function () {
                    clearError(this);
                });
            }
        }
    });
});

// Function to handle both Add & Edit Artwork
function handleArtworkSubmission(action) {
    let isEdit = action === "edit";
    let artworkId = isEdit ? document.getElementById("editArtworkId").value : null;

    let inputElements = [
        { element: document.getElementById(isEdit ? "editArtworkTitle" : "artworkTitle"), id: isEdit ? "editArtworkTitle" : "artworkTitle" },
        { element: document.getElementById(isEdit ? "editArtworkStudentName" : "studentName"), id: isEdit ? "editArtworkStudentName" : "studentName" },
        { element: document.getElementById(isEdit ? "editArtworkFacebookLink" : "facebookLink"), id: isEdit ? "editArtworkFacebookLink" : "facebookLink", required: false },
        { element: document.getElementById(isEdit ? "editArtworkTwitterLink" : "twitterLink"), id: isEdit ? "editArtworkTwitterLink" : "twitterLink", required: false },
        { element: document.getElementById(isEdit ? "editArtworkInstagramLink" : "instagramLink"), id: isEdit ? "editArtworkInstagramLink" : "instagramLink", required: false },
        { element: document.getElementById(isEdit ? "editArtworkImage" : "artworkImage"), id: isEdit ? "editArtworkImage" : "artworkImage", required: !isEdit }
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
    formData.append("student_name", inputElements[1].element.value.trim());
    formData.append("facebook_link", inputElements[2].element.value.trim());
    formData.append("twitter_link", inputElements[3].element.value.trim());
    formData.append("instagram_link", inputElements[4].element.value.trim());
    if (inputElements[5].element.files[0]) formData.append("artwork", inputElements[5].element.files[0]);

    let url = isEdit ? `http://localhost:5000/artworks/${artworkId}` : "http://localhost:5000/artworks/upload";
    let method = isEdit ? "PUT" : "POST";

    fetch(url, { method, body: formData })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: isEdit ? "Artwork has been updated successfully." : "Artwork has been added successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                fetchArtworks(); 
                if (isEdit) document.getElementById("editArtworkModal").querySelector(".btn-close").click();
                else location.reload();
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: "Error!",
            text: isEdit ? "Failed to update artwork. Please try again." : "Failed to add artwork. Please try again.",
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
document.addEventListener("DOMContentLoaded", fetchArtworks);

