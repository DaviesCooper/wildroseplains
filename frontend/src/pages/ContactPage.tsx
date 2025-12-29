import './ContactPage.css';

export const ContactPage = () => {
  return (
    <div className="page contact">
      <div className="contact-grid">
        <div className="panel contact-details">
          <h2>How to inquire</h2>
            Email us with the essentials and we will reply within two business days.
            Sharing a few specifics helps us recommend the right approach and timeline.
          <ul className="contact-list">
            <li>Project type: deck box, artwork, wholesale, etc.</li>
            <li>Timeline and key dates</li>
            <li>Inspiration or references (links welcome)</li>
            <li>Preferred materials, finishes, or formats</li>
          </ul>
            If you are local to Calgary, mention your availability for an appointment.
            For wholesale, include quantities and target launch dates.
          <dt>Email</dt>
              <dd>
                <a href="mailto:hello@wildroseplains.com">hello@wildroseplains.com</a>
              </dd>
        </div>
      </div>
    </div>
  );
};

