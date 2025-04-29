import nodemailer from 'nodemailer';

class EmailQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.sentInCurrentMinute = 0;
    this.lastResetTime = Date.now();
    this.maxEmailsPerMinute = 25;
    this.count = 0; 

    this.transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });
  }

  async add(job) {
    if (Array.isArray(job)) {
      this.queue.push(...job);
    } else {
      this.queue.push(job);
    }
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();

      // Reset counter if a minute has passed
      if (now - this.lastResetTime >= 60000) {
        this.sentInCurrentMinute = 0;
        this.lastResetTime = now;
      }

      // If limit hit, wait
      if (this.sentInCurrentMinute >= this.maxEmailsPerMinute) {
        const waitTime = 60000 - (now - this.lastResetTime);
        console.log(`Rate limit hit. Waiting ${waitTime / 1000}s`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.sentInCurrentMinute = 0;
        this.lastResetTime = Date.now();
      }

      const job = this.queue.shift();

      try {
        await this.sendEmail(job);
        this.sentInCurrentMinute += 1;
        this.count += 1;
        console.log(`Email sent to ${job.email} : ${this.count}`);
      } catch (error) {
        console.error(`Error sending email to ${job.email}:`, error);
        if ((job.attempts || 0) < 3) {
          job.attempts = (job.attempts || 0) + 1;
          console.log(`Retrying ${job.email}, attempt ${job.attempts}`);
          this.queue.push(job);
        }
      }
    }

    this.isProcessing = false;
  }

  async sendEmail(job) {
    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: job.email,
      subject: job.subject,
      html: job.html,
      attachments: job.attachments || [],
    };

    await this.transporter.sendMail(mailOptions);
  }
}

const emailQueue = new EmailQueue();
export { emailQueue };