//Initialize News DataTable
$(document).ready(function() {
    $('#videosTable').DataTable({
        paging: false,  // Remove pagination
        info: false,    // Remove "Showing X of X entries"
        searching: false, // Remove search bar
        lengthChange: false, // Remove "Show entries" dropdown
        ordering: false,
    });
});

// Custom Search Function
document.getElementById("searchInput").addEventListener("keyup", function () {
    let filter = this.value.toLowerCase();
    let rows = document.querySelectorAll("#videosTable tbody tr");

    rows.forEach(row => {
        let text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
});

document.addEventListener("DOMContentLoaded", function () {
    // Add Video Event
    document.getElementById("submitVideo").addEventListener("click", function () {
        handleVideoSubmission("add");
    });

    // Edit Video Event
    document.getElementById("saveVideoChanges").addEventListener("click", function () {
        handleVideoSubmission("edit");
    });

    // Remove error messages when typing
    let fields = ["videoTitle", "videoLink", "videoThumbnail", "editVideoTitle", "editVideoLink", "editVideoThumbnail"];

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

// Fetch and display videos
function fetchVideos() {
    fetch("http://localhost:5000/videos")
        .then(response => response.json())
        .then(videos => {
            let videosTableBody = document.querySelector("#videosTable tbody");
            videosTableBody.innerHTML = "";

            videos.forEach(video => {
                let statusPill = video.isDeleted === 1 
                    ? '<span class="badge rounded-pill bg-secondary px-4 py-2" style="font-size:15px">Archived</span>' 
                    : '<span class="badge rounded-pill bg-success px-4 py-2" style="font-size:15px">Active</span>';

                let row = `<tr data-id="${video.id}">
                    <td>${video.id}</td>
                    <td>${video.title}</td>
                    <td><a href="${video.video_link}" target="_blank">Watch</a></td>
                    <td>${video.description}</td>
                    <td>${new Date(video.upload_date).toLocaleDateString("en-US", { 
                        year: "numeric", 
                        month: "long", 
                        day: "2-digit" 
                    })}</td>                    
                    <td class="text-center">${statusPill}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning edit-btn my-1" data-id="${video.id}" data-bs-toggle="modal" data-bs-target="#editVideoModal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm ${video.isDeleted === 1 ? "btn-success" : "btn-secondary"} archive-btn my-1" data-id="${video.id}" data-isDeleted="${video.isDeleted}">
                            ${video.isDeleted === 1 ? '<i class="fas fa-undo"></i>' : '<i class="fas fa-box"></i>'}
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn my-1" data-id="${video.id}" ${video.isDeleted === 0 ? "disabled" : ""}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;

                videosTableBody.innerHTML += row;
            });

            attachEditEvents();
            attachDeleteEvents();
            attachArchiveEvents();
        })
        .catch(error => console.error("Error fetching videos:", error));
}

// Delete video based on ID
function attachDeleteEvents() {
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", function () {
            let videoId = this.getAttribute("data-id");

            // SweetAlert2 Confirmation Dialog
            Swal.fire({
                title: "Are you sure?",
                text: "This video will be permanently deleted!",
                icon: "warning",
                iconColor: "#dc3545",
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Yes, delete it!"
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch(`http://localhost:5000/videos/${videoId}`, { method: "DELETE" })
                        .then(response => response.json())
                        .then(data => {
                            // SweetAlert2 Success Message
                            Swal.fire({
                                title: "Deleted!",
                                text: "Video has been deleted.",
                                icon: "success",
                                timer: 1500,
                                showConfirmButton: false
                            });
                            fetchVideos(); // Refresh table after deletion
                        })
                        .catch(error => console.error("Error deleting video:", error));
                }
            });
        });
    });
}

// Archive or restore video
function attachArchiveEvents() {
    document.querySelectorAll(".archive-btn").forEach(button => {
        button.addEventListener("click", function () {
            let videoId = this.getAttribute("data-id");
            let currentStatus = this.getAttribute("data-isDeleted");

            let newStatus = currentStatus === "1" ? 0 : 1;

            fetch(`http://localhost:5000/videos/${videoId}/archive`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDeleted: newStatus })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    Swal.fire({
                        title: "Success!",
                        text: `Video has been ${newStatus === 1 ? "archived" : "restored"}.`,
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        fetchVideos(); // Refresh videos list
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

// Populate the fields in Edit Video
function attachEditEvents() {
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", function () {
            let videoId = this.getAttribute("data-id");
            fetch(`http://localhost:5000/videos/${videoId}`)
                .then(response => response.json())
                .then(video => {
                    document.getElementById("editVideoId").value = video.id;
                    document.getElementById("editVideoTitle").value = video.title;
                    document.getElementById("editVideoDescription").value = video.description;
                    document.getElementById("editVideoLink").value = video.video_link;
                })
                .catch(error => console.error("Error fetching video details:", error));
        });
    });
}

// Function to handle both Add & Edit Video
function handleVideoSubmission(action) {
    let isEdit = action === "edit";

    let videoId = isEdit ? document.getElementById("editVideoId").value : null;
    let titleInput = document.getElementById(isEdit ? "editVideoTitle" : "videoTitle");
    let linkInput = document.getElementById(isEdit ? "editVideoLink" : "videoLink");
    let descriptionInput = document.getElementById(isEdit ? "editVideoDescription" : "videoDescription");


    let videoTitle = titleInput.value.trim();
    let videoLink = linkInput.value.trim();
    let videoDescription = descriptionInput.value.trim();


    let isValid = true;

    let inputElements = [
        { element: videoTitle, id: isEdit ? "editVideoTitle" : "videoTitle" },
        { element: videoLink, id: isEdit ? "editVideoLink" : "videoLink" },
        { element: videoDescription, id: isEdit ? "editVideoDescription" : "videoDescription" }
    ];

    // Clear previous errors
    inputElements.forEach(({ id }) => clearError(document.getElementById(id)));

    // Validation
    inputElements.forEach(({ element, id, required = true }) => {
        if (required && !element) {
            showError(document.getElementById(id), "This field is required.");
            isValid = false;
        }
    });

    if (!isValid) return; // Stop execution if validation fails

    let formData = JSON.stringify({
        title: videoTitle,
        video_link: videoLink,
        description: videoDescription
    });

    let url = isEdit ? `http://localhost:5000/videos/${videoId}` : "http://localhost:5000/videos/upload";
    let method = isEdit ? "PUT" : "POST";

    fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json"
        },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: isEdit ? "Video has been updated successfully." : "Video has been added successfully.",
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
            text: isEdit ? "Failed to update video. Please try again." : "Failed to add video. Please try again.",
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
document.addEventListener("DOMContentLoaded", fetchVideos);
