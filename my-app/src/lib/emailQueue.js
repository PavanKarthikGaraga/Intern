import nodemailer from 'nodemailer';

class EmailQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async add(job) {
    this.queue.push(job);
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    try {
      await this.sendEmail(job);
      console.log(`Email sent to ${job.email}`);
    } catch (error) {
      console.error(`Error sending email to ${job.email}:`, error);
      // Retry logic
      if (job.attempts < 3) {
        job.attempts = (job.attempts || 0) + 1;
        this.queue.push(job);
      }
    }

    // Process next job
    setTimeout(() => this.processQueue(), 1000);
  }

  async sendEmail(job) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: job.email,
      subject: job.subject,
      html: job.html,
      attachments: job.attachments || []
    };

    console.log("sending mail to ", job.email);

    await transporter.sendMail(mailOptions);

    console.log("mail sent to ", job.email);
  }
}

// Create a singleton instance
const emailQueue = new EmailQueue();

export { emailQueue }; 