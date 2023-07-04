import express from 'express';
import { MessagePublisherService } from './MessagePublisherService';

export class MessagePublisherServer {
  private app: express.Express;
  private messagePublisherService: MessagePublisherService;

  private initializeServer() {
    this.app = express();

    this.app.get('', async (req, res) => {
      try {
        const eventsPublished = await this.messagePublisherService.poll();

        return res.json(eventsPublished);
      } catch (err) {
        res.statusCode = 500;
        return res.json({
          error: err,
        });
      }
    });
  }

  constructor(messagePublisherService: MessagePublisherService) {
    this.messagePublisherService = messagePublisherService;

    this.initializeServer();
  }

  public start() {
    this.app.listen(5000, () => {
      console.log(`Listening on port ${5000}`);
    });
  }
}
