import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /**
   * Basic health endpoint.
   * With global prefix `api`, this responds on GET /api with HTTP 200.
   */
  @Get()
  health() {
    return { status: 'ok' };
  }
}


