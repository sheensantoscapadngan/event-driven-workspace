export class EmailService {
  constructor() {
    // initialize 3rd party service here
  }
  public send(email: string, message: string) {
    console.log(`Sending delivery email to ${email} with message \n${message}`);
  }
}
