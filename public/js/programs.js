//Initialize News DataTable
$(document).ready(function() {
    $('#programsTable').DataTable({
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
    let rows = document.querySelectorAll("#programsTable tbody tr");

    rows.forEach(row => {
        let text = row.textContent.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
});

// Updates image preview when a file is selected
document.getElementById("programForm").addEventListener("change", function (event) {
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

// Function to handle enabling/disabling the Program Name dropdown
document.addEventListener('DOMContentLoaded', function() {
    const departmentSelect = document.getElementById('departmentName');
    const programSelect = document.getElementById('programName');

    function handleProgramNameState() {
        if (departmentSelect.value === 'Senior High School') {
            programSelect.disabled = true; 
        } else {
            programSelect.disabled = false;
        }
    }

    departmentSelect.addEventListener('change', handleProgramNameState);

    // Initial check to disable the Program Name dropdown if Senior High School is selected by default
    handleProgramNameState();
});

// Add Program
document.getElementById("submitProgram").addEventListener("click", function () {
    let coverImage = document.getElementById("coverImage").files[0];
    let departmentName = document.getElementById("departmentName").value.trim();
    let programName = document.getElementById("programName").value.trim();
    let programSpecialization = document.getElementById("programSpecialization").value.trim();
    let programDescription = document.getElementById("programDescription").value.trim();
    let numberOfTerms = document.getElementById("numberOfTerms").value.trim();
    let duration = document.getElementById("programDuration").value.trim();
    let internship = document.getElementById("internshipDuration").value.trim();
    let careers = document.getElementById("careerOpportunities").value.trim();

    if (!coverImage || !departmentName || !programName || !programSpecialization || !programDescription || !numberOfTerms || !duration || !internship || !careers) {
        Swal.fire({
            title: "Warning!",
            text: "All fields are required.",
            icon: "warning",
            iconColor: "#f39c12",
            confirmButtonColor: "#6c757d"
        });
        return;
    }

    let formData = new FormData();
    formData.append("cover_image", coverImage);
    formData.append("department_name", departmentName);
    formData.append("program_name", programName);
    formData.append("program_specialization", programSpecialization);
    formData.append("program_description", programDescription);
    formData.append("number_of_terms", numberOfTerms);
    formData.append("duration", duration);
    formData.append("internship", internship);
    formData.append("careers", careers);

    fetch("http://localhost:5000/programs/upload", {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: "Program added successfully.",
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
            text: "Failed to add program. Please try again.",
            icon: "error",
            iconColor: "#d33",
            confirmButtonColor: "#10326F"
        });
        console.error("Error:", error);
    });
});


// Fetch and display programs
function fetchPrograms() {
    fetch("http://localhost:5000/programs")
        .then(response => response.json())
        .then(programs => {
            let programTableBody = document.querySelector("#programsTable tbody");
            programTableBody.innerHTML = "";

            programs.forEach(item => {
                let statusPill = item.isDeleted === 1 
                ? '<span class="badge rounded-pill bg-secondary px-4 py-2" style="font-size:15px">Archived</span>' 
                : '<span class="badge rounded-pill bg-success px-4 py-2"  style="font-size:15px">Active</span>';
                
                let row = `<tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>${item.department_name}</td>
                    <td>${item.program_name}</td>
                    <td>${item.program_specialization}</td>
                    <td>${item.program_description}</td>
                    <td>${item.number_of_terms}</td>
                    <td>${item.duration}</td>
                    <td>${item.internship}</td>
                    <td>${item.careers}</td>
                    <td><img src="${item.cover_image}" width="50"></td>
                    <td>${new Date(item.upload_date).toLocaleDateString("en-US", { 
                        year: "numeric", 
                        month: "long", 
                        day: "2-digit" 
                    })}</td>
                    <td class="text-center">${statusPill}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning edit-btn my-1" data-id="${item.id}" data-bs-toggle="modal" data-bs-target="#editProgramModal">
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
                programTableBody.innerHTML += row;
            });

            attachDeleteEvents();
            attachArchiveEvents();  
            attachEditEvents();     
        })
        .catch(error => console.error("Error fetching programs:", error));
}


// Delete programs based on ID
function attachDeleteEvents() {
    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", function () {
            let programId = this.getAttribute("data-id");

            // SweetAlert2 Confirmation Dialog
            Swal.fire({
                title: "Are you sure?",
                text: "This program will be permanently deleted!",
                icon: "warning",
                iconColor:"#dc3545",
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Yes, delete it!"
            }).then((result) => {
                if (result.isConfirmed) {
                    fetch(`http://localhost:5000/programs/${programId}`, { method: "DELETE" })
                        .then(response => response.json())
                        .then(data => {
                            Swal.fire({
                                title: "Deleted!",
                                text: "Program has been deleted.",
                                icon: "success",
                                timer: 1500,
                                showConfirmButton: false
                            });
                            fetchPrograms(); // Refresh table after deletion
                        })
                        .catch(error => console.error("Error deleting program:", error));
                }
            });
        });
    });
}

// Archives the program
function attachArchiveEvents() {
    document.querySelectorAll(".archive-btn").forEach(button => {
        button.addEventListener("click", function () {
            let programId = this.getAttribute("data-id");
            let currentStatus = this.getAttribute("data-isDeleted");

            let newStatus = currentStatus === "1" ? 0 : 1;

            fetch(`http://localhost:5000/programs/${programId}/archive`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isDeleted: newStatus })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    Swal.fire({
                        title: "Success!",
                        text: `Program has been ${newStatus === 1 ? "archived" : "restored"}.`,
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        fetchPrograms(); // Refresh program list
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

// Populate the fields in Edit Program
function attachEditEvents() {
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", function () {
            let programId = this.getAttribute("data-id");

            fetch(`http://localhost:5000/programs/${programId}`)
                .then(response => response.json())
                .then(program => {
                    document.getElementById("editProgramId").value = program.id;
                    document.getElementById("editDepartmentName").value = program.department_name;
                    document.getElementById("editProgramName").value = program.program_name;
                    document.getElementById("editProgramSpecialization").value = program.program_specialization;
                    document.getElementById("editProgramDescription").value = program.program_description;
                    document.getElementById("editNumberOfTerms").value = program.number_of_terms;
                    document.getElementById("editProgramDuration").value = program.duration;
                    document.getElementById("editInternshipDuration").value = program.internship;
                    document.getElementById("editCareerOpportunities").value = program.careers;


                    

                    let imagePreview = document.getElementById("editProgramPreview");
                    let imagePlaceholder = document.getElementById("editProgramPlaceholder");

                    if (program.cover_image) {
                        imagePreview.src = program.cover_image;
                        imagePreview.classList.remove("d-none");
                        imagePlaceholder.style.display = "none";
                    } else {
                        imagePreview.src = "";
                        imagePreview.classList.add("d-none");
                        imagePlaceholder.style.display = "block";
                    }

                    // Show the modal
                    let editModal = new bootstrap.Modal(document.getElementById("editProgramModal"));
                    editModal.show();
                })
                .catch(error => console.error("Error fetching program details:", error));
        });
    });
}

// Edit Program Image Preview
document.getElementById("editCoverImage").addEventListener("change", function (event) {
    const imagePreview = document.getElementById("editProgramPreview");
    const imagePlaceholder = document.getElementById("editProgramPlaceholder");

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

// Saves the changes in Edit Program
document.getElementById("saveProgramChanges").addEventListener("click", function () {
    let programId = document.getElementById("editProgramId").value;
    let departmentName = document.getElementById("editDepartmentName").value.trim();
    let programName = document.getElementById("editProgramName").value.trim();
    let programSpecialization = document.getElementById("editProgramSpecialization").value.trim();
    let programDescription = document.getElementById("editProgramDescription").value.trim();
    let numberOfTerms = document.getElementById("editNumberOfTerms").value.trim();
    let duration = document.getElementById("editProgramDuration").value.trim();
    let internship = document.getElementById("editInternshipDuration").value.trim();
    let careers = document.getElementById("editCareerOpportunities").value.trim();

    if (!departmentName || !programName || !programSpecialization || !programDescription || !numberOfTerms || !duration || !internship || !careers) {
        Swal.fire({
            title: "Warning!",
            text: "Please fill in all the required fields.",
            icon: "warning",
            confirmButtonColor: "#6c757d"
        });
        return;
    }

    let formData = new FormData();
    formData.append("department_name", departmentName);
    formData.append("program_name", programName);
    formData.append("program_specialization", programSpecialization);
    formData.append("program_description", programDescription);
    formData.append("number_of_terms", numberOfTerms);
    formData.append("duration", duration);
    formData.append("internship", internship);
    formData.append("careers", careers);

    let imageFile = document.getElementById("editCoverImage").files[0];
    if (imageFile) {
        formData.append("cover_image", imageFile);
    }

    fetch(`http://localhost:5000/programs/${programId}`, {
        method: "PUT",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            Swal.fire({
                title: "Success!",
                text: "Program has been updated successfully.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                let editModal = document.getElementById("editProgramModal");
                let modalInstance = bootstrap.Modal.getInstance(editModal);

                if (modalInstance) {
                    modalInstance.hide();
                }

                document.querySelectorAll(".modal-backdrop").forEach(backdrop => backdrop.remove());
                document.body.classList.remove("modal-open");
                document.body.style = "";
            
                fetchPrograms(); 
                document.getElementById("editProgramModal").querySelector(".btn-close").click();
            });
        }
    })
    .catch(error => {
        Swal.fire({
            title: "Error!",
            text: "Failed to update program. Please try again.",
            icon: "error",
            iconColor: "#d33",
            confirmButtonColor: "#10326F"
        });
        console.error("Error updating program:", error);
    });
});

// Call fetchPrograms() when the page loads
document.addEventListener("DOMContentLoaded", fetchPrograms);