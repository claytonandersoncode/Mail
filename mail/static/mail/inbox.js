document.addEventListener('DOMContentLoaded', function() {

    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);
  
    // When compose form is submitted run anonymous submit email
    document.querySelector('#compose-form').addEventListener('submit', () => send_email()); 
  
    // By default, load the inbox
    load_mailbox('inbox');
  
  });
  
  function compose_email() {
  
    // Show compose view and hide other views
    document.querySelector('#mailbox-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
  
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
  
  };
  
  function load_mailbox(mailbox) {
    
    // Show the mailbox and hide other views
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#mailbox-view').style.display = 'block';
  
    // Show the mailbox name
    document.querySelector('#mailbox-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
    // Display emails in that malbox
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
    
      // For each email in that mailbox ... 
      emails.forEach(element => {  
      
       // Check if email is read, assign appropriate CSS class 
      if (element.read === true) {
        readcheck = 'email-div-read'; 
      } else {
        readcheck = 'email-div';
      } 
  
      // Create div element with custom CSS class, and create an innerHTML with the email content
      // also create a click event on the div that runs the load_email function
       const email = document.createElement('div');
       email.className = `${readcheck}`;
       email.innerHTML = `<div class="d-flex mb-3"><div class="p-2"><b>${element.sender}</b></div><div class="p-2 truncate">${element.subject}</div> <div class="ml-auto p-2">${element.timestamp}</div></div>`
       email.addEventListener('click', () => load_email(mailbox, element.id));
       document.querySelector('#mailbox-view').append(email);
  
      });
    });
  };

  function send_email() {
  
    // Send email with values in the compose form
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value,
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);
        // Load sent mailbox (along with onsubmit=false in html)
        load_mailbox('sent')
    });
  
  };
  
  function load_email(mailbox, id) {
  
    // Show the email and hide other views
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#mailbox-view').style.display = 'none';
  
    // Look up email by id    
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      
        // Add that content to email-view div 
        document.querySelector('#email-view').innerHTML = 
        `<p><b>From:</b> ${email.sender}</p>
        <p><b>To:</b> ${email.recipients}</p>
        <p><b>Subject:</b> ${email.subject}</p>
        <p><b>Timestamp:</b> ${email.timestamp}</p>`;

        // If mailbox is inbox display archive button
        if (mailbox === 'inbox') {
          const archive = document.createElement('button');
          archive.className = 'btn btn-outline-primary btn-sm email-btn';
          archive.innerHTML = 'Archive';
          archive.addEventListener('click', () => archive_email(email.id, email.archived));
          document.querySelector('#email-view').append(archive);
        }

        // If mailbox is archive display unarchive button
        if (mailbox === 'archive') {
          const unarchive = document.createElement('button');
          unarchive.className = 'btn btn-outline-primary btn-sm email-btn';
          unarchive.innerHTML = 'Unarchive';
          unarchive.addEventListener('click', () => archive_email(email.id, email.archived));
          document.querySelector('#email-view').append(unarchive);
        }

        // Display reply button
        const reply = document.createElement('button');
        reply.className = 'btn btn-outline-primary btn-sm email-btn';
        reply.innerHTML = 'Reply';
        reply.addEventListener('click', () => reply_email(email));
        document.querySelector('#email-view').append(reply);

        
        // Display body of email
        const body = document.createElement('div');
        body.innerHTML = `<p>${email.body}</p>`;
        const hr = document.createElement('hr');
        document.querySelector('#email-view').append(hr, body);
  
        // Run read_email function if this email had not been read, saves PUT requests
        if (email.read !== true) {
          read_email(email.id)
        } 
    
    });
  };

  function reply_email(email) {
   
    //Hide other views and display composition form
    document.querySelector('#mailbox-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';

    //Fill fields with values from selected email
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: \n\n ${email.body} \n\n`;
    document.querySelector('#compose-body').focus();
  
  };
  
  function archive_email(id, archived) {

    // Check emails archived value and assign new one 
    if (archived === true) {
      archived = false
    } else {
      archived = true
    }
    
    // Update emails archived value with assined
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: archived
      })
    });
    
    // Reload the page to default (load_mailbox('index')) to get new state
    location.reload()

  };

  function read_email(id) {
    
    // Update emails read value with true
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    });

  };