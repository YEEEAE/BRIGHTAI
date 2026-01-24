document.addEventListener('DOMContentLoaded', function() {
  const jobTitleInput = document.getElementById('job-title');
  const jobDescriptionInput = document.getElementById('job-description');
  const addJobBtn = document.getElementById('add-job-btn');
  const jobsListTableBody = document.getElementById('jobs-list').querySelector('tbody');
  const jobSelect = document.getElementById('job-select');
  const candidateNameInput = document.getElementById('candidate-name');
  const candidateEmailInput = document.getElementById('candidate-email');
  const candidateSkillsInput = document.getElementById('candidate-skills');
  const addCandidateBtn = document.getElementById('add-candidate-btn');
  const candidatesListTableBody = document.getElementById('candidates-list').querySelector('tbody');
    const searchJobInput = document.getElementById('search-job');
    const searchJobBtn = document.getElementById('search-job-btn');
    const editJobModal = document.getElementById('edit-job-modal');
    const editJobIndexInput = document.getElementById('edit-job-index');
    const editJobTitleInput = document.getElementById('edit-job-title');
    const editJobDescriptionInput = document.getElementById('edit-job-description');
    const saveEditJobBtn = document.getElementById('save-edit-job-btn');
    const editCandidateModal = document.getElementById('edit-candidate-modal');
    const editCandidateIndexInput = document.getElementById('edit-candidate-index');
    const editJobSelectInput = document.getElementById('edit-job-select');
    const editCandidateNameInput = document.getElementById('edit-candidate-name');
    const editCandidateEmailInput = document.getElementById('edit-candidate-email');
    const editCandidateSkillsInput = document.getElementById('edit-candidate-skills');
     const saveEditCandidateBtn = document.getElementById('save-edit-candidate-btn');
     const closeModalBtns = document.querySelectorAll('.close-modal');
      const searchCandidateInput = document.getElementById('search-candidate');
       const filterSkillsInput = document.getElementById('filter-skills');
    const searchCandidateBtn = document.getElementById('search-candidate-btn');

  let jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
  let candidates = JSON.parse(localStorage.getItem('candidates') || '[]');
    // Google Sheets API configuration (replace with your values)
    const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace with your client ID
    const API_KEY = 'YOUR_API_KEY'; // Replace with your API key
     const SHEET_ID = 'YOUR_SHEET_ID'; // Replace with your sheet ID
    const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
    let googleAuth = null;
        function handleClientLoad() {
      gapi.load('client:auth2', initClient);
        }
     function initClient() {
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
            scope: SCOPES
        }).then(() => {
            googleAuth = gapi.auth2.getAuthInstance();
             // Check if the user is already signed in
             if(googleAuth.isSignedIn.get()){
                 console.log("User is already signed in");
             }
             else{
               console.log("User is not signed in");
                 // Initiate sign in
                googleAuth.signIn()
                    .then(googleUser => {
                      console.log("User signed in", googleUser);
                          syncDataWithGoogleSheets();
                    })
                    .catch(error => console.error("Error during sign in:", error));

                }
         }, error => {
           console.error("Error during init:", error)
        });

    }

      function syncDataWithGoogleSheets() {
         // Sync jobs data
           syncJobsToSheet();
         // Sync candidates data
          syncCandidatesToSheet()

      }

       async function syncJobsToSheet() {
         const values = jobs.map(job => [job.title, job.description]);
            try {
                 await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: 'Jobs!A1', // Update this with your sheet and range for jobs
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values,
                    }
                });
               console.log("Jobs synced to sheet");
            }
            catch (e) {
             console.error('Error syncing jobs',e);
            }
        }
          async function syncCandidatesToSheet() {
             const values = candidates.map(candidate => [candidate.name, candidate.email, candidate.job, candidate.skills]);
            try {
                 await gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_ID,
                range: 'Candidates!A1', // Update this with your sheet and range for candidates
                 valueInputOption: 'USER_ENTERED',
                resource: {
                    values: values,
                    }
                });
                 console.log("Candidates synced to sheet");
            }
            catch (e) {
             console.error('Error syncing candidates',e)
            }
        }
  handleClientLoad()

    function updateJobsList() {
        jobsListTableBody.innerHTML = '';
          jobs.forEach((job, index) => {
            const row = jobsListTableBody.insertRow();
              row.insertCell().textContent = job.title;
                row.insertCell().textContent = job.description;
                const actionsCell = row.insertCell();
                 const editBtn = document.createElement('button');
              editBtn.innerHTML = '<i class="fas fa-edit"></i>';
               editBtn.classList.add('button')
                editBtn.addEventListener('click', () => showEditJobModal(index));
              actionsCell.appendChild(editBtn)
              const deleteBtn = document.createElement('button');
             deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
              deleteBtn.classList.add('button')
             deleteBtn.addEventListener('click', () => deleteJob(index));
             actionsCell.appendChild(deleteBtn)

        });
    }
    function showEditJobModal(index) {
         editJobModal.style.display = 'block';
         editJobIndexInput.value = index;
         editJobTitleInput.value = jobs[index].title;
         editJobDescriptionInput.value = jobs[index].description;
        }

        saveEditJobBtn.addEventListener('click', async function() {
            const index = parseInt(editJobIndexInput.value);
            const title = editJobTitleInput.value.trim();
            const description = editJobDescriptionInput.value.trim();
            if (!title || !description) {
                alert('الرجاء إدخال جميع بيانات الوظيفة.');
                return;
            }

        jobs[index].title = title;
        jobs[index].description = description;
        localStorage.setItem('jobs', JSON.stringify(jobs));
            await syncJobsToSheet()
        editJobModal.style.display = 'none';
         updateJobsList();
         updateJobSelect();
    });
      function deleteJob(index) {
        jobs.splice(index, 1);
         localStorage.setItem('jobs', JSON.stringify(jobs));
         updateJobsList();
          updateJobSelect()
          updateCandidatesList();
        }
     closeModalBtns.forEach(btn => {
            btn.addEventListener('click', function() {
           const modal = btn.closest('.modal');
           if(modal) {
                modal.style.display = 'none';
           }
        });
    });
    function updateJobSelect() {
        jobSelect.innerHTML = '<option value="">اختر الوظيفة</option>';
        editJobSelectInput.innerHTML = '<option value="">اختر الوظيفة</option>';
        jobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job.title;
            option.textContent = job.title;
            jobSelect.appendChild(option);
             const editOption = document.createElement('option');
              editOption.value = job.title;
             editOption.textContent = job.title;
             editJobSelectInput.appendChild(editOption)

        });
    }
    function updateCandidatesList(filteredCandidates = null) {
          candidatesListTableBody.innerHTML = '';
          const candidatesToDisplay = filteredCandidates || candidates;
          candidatesToDisplay.forEach((candidate, index) => {
            const row = candidatesListTableBody.insertRow();
            row.insertCell().textContent = candidate.name;
              row.insertCell().textContent = candidate.email;
              row.insertCell().textContent = candidate.job;
              row.insertCell().textContent = candidate.skills;
            const actionsCell = row.insertCell();
               const editBtn = document.createElement('button');
              editBtn.innerHTML = '<i class="fas fa-edit"></i>';
               editBtn.classList.add('button')
                editBtn.addEventListener('click', () => showEditCandidateModal(index));
              actionsCell.appendChild(editBtn)
              const deleteBtn = document.createElement('button');
             deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
              deleteBtn.classList.add('button')
             deleteBtn.addEventListener('click', () => deleteCandidate(index));
             actionsCell.appendChild(deleteBtn)
          });
    }
       function showEditCandidateModal(index) {
         editCandidateModal.style.display = 'block';
          editCandidateIndexInput.value = index;
           editJobSelectInput.value = candidates[index].job;
         editCandidateNameInput.value = candidates[index].name;
           editCandidateEmailInput.value = candidates[index].email;
           editCandidateSkillsInput.value = candidates[index].skills;
        }
       saveEditCandidateBtn.addEventListener('click', async function() {
            const index = parseInt(editCandidateIndexInput.value);
            const job = editJobSelectInput.value
             const name = editCandidateNameInput.value.trim();
            const email = editCandidateEmailInput.value.trim();
           const skills = editCandidateSkillsInput.value.trim();
        if (!name || !email || !skills || !job) {
             alert('الرجاء إدخال جميع بيانات المرشح.');
             return;
        }
        candidates[index].name = name;
        candidates[index].email = email;
        candidates[index].skills = skills;
         candidates[index].job = job;
       localStorage.setItem('candidates', JSON.stringify(candidates));
         await syncCandidatesToSheet()
       editCandidateModal.style.display = 'none';
         updateCandidatesList();
    });
  function deleteCandidate(index) {
      candidates.splice(index, 1);
      localStorage.setItem('candidates', JSON.stringify(candidates));
      updateCandidatesList();
  }
  addJobBtn.addEventListener('click', async function() {
    const title = jobTitleInput.value.trim();
    const description = jobDescriptionInput.value.trim();

    if (!title || !description) {
      alert('الرجاء إدخال جميع بيانات الوظيفة.');
      return;
    }

    const newJob = { title, description };
    jobs.push(newJob);
       localStorage.setItem('jobs', JSON.stringify(jobs));
      jobTitleInput.value = '';
      jobDescriptionInput.value = '';
          await syncJobsToSheet();
    updateJobsList();
    updateJobSelect();
  });
  addCandidateBtn.addEventListener('click', async function() {
    const job = jobSelect.value;
    const name = candidateNameInput.value.trim();
    const email = candidateEmailInput.value.trim();
     const skills = candidateSkillsInput.value.trim();

    if (!name || !email || !skills || !job) {
      alert('الرجاء إدخال جميع بيانات المرشح.');
      return;
    }
     const newCandidate = { name, email, skills, job};
       candidates.push(newCandidate);
        localStorage.setItem('candidates', JSON.stringify(candidates));
        candidateNameInput.value = '';
        candidateEmailInput.value = '';
        candidateSkillsInput.value = '';
           await syncCandidatesToSheet();
    updateCandidatesList();
  });
    searchJobBtn.addEventListener('click', function() {
        const searchTerm = searchJobInput.value.trim().toLowerCase();
          if(!searchTerm) {
           updateJobsList();
            return;
          }
        const filteredJobs = jobs.filter(job =>
            job.title.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm)
        );

        jobsListTableBody.innerHTML = '';
        filteredJobs.forEach((job, index) => {
             const row = jobsListTableBody.insertRow();
              row.insertCell().textContent = job.title;
                row.insertCell().textContent = job.description;
                   const actionsCell = row.insertCell();
                 const editBtn = document.createElement('button');
              editBtn.innerHTML = '<i class="fas fa-edit"></i>';
               editBtn.classList.add('button')
                editBtn.addEventListener('click', () => showEditJobModal(index));
              actionsCell.appendChild(editBtn)
              const deleteBtn = document.createElement('button');
             deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
              deleteBtn.classList.add('button')
             deleteBtn.addEventListener('click', () => deleteJob(index));
             actionsCell.appendChild(deleteBtn)
        });
    });
        searchCandidateBtn.addEventListener('click', function() {
          const searchTerm = searchCandidateInput.value.trim().toLowerCase();
            const skillsFilter = filterSkillsInput.value.trim().toLowerCase().split(',').map(skill => skill.trim()).filter(skill => skill);
          let filteredCandidates = candidates
         if (searchTerm) {
            filteredCandidates = filteredCandidates.filter(candidate =>
            candidate.name.toLowerCase().includes(searchTerm) ||
              candidate.email.toLowerCase().includes(searchTerm) ||
                candidate.skills.toLowerCase().includes(searchTerm)
           );
        }
       if (skillsFilter.length > 0) {
          filteredCandidates = filteredCandidates.filter(candidate => {
                return skillsFilter.every(skill => candidate.skills.toLowerCase().includes(skill));
             });
            }
         updateCandidatesList(filteredCandidates);
        });
    updateJobsList();
    updateJobSelect();
     updateCandidatesList();

});