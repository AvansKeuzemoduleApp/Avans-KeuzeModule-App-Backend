import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
} from '@nestjs/common';
import { ModuleService } from './module.service';
import { Public } from '../auth/guards/public.decorator';
import { QueryModuleDto } from './dto/query-module.dto';

type RequestWithUser = Request & { user?: { sub: string } };

@Controller('modules')
export class ModuleController {
  constructor(private readonly moduleService: ModuleService) {}

  @Get()
  async findAll(@Req() req: RequestWithUser, @Query() query: QueryModuleDto) {
    const userId = req.user?.sub;

    if (!userId) {
      // For unauthenticated requests, do not mutate the incoming query object.
      // Instead, pass a derived query with favourites explicitly set to false
      // and an undefined user ID.
      return this.moduleService.findAll(
        { ...query, favourites: false },
        undefined,
      );
    }

    return this.moduleService.findAll(query, userId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.sub;
    return this.moduleService.findOne(id, userId);
  }
}
