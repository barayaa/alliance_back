import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PostesService } from './postes.service';
import { CreatePosteDto } from './dto/create-poste.dto';
import { UpdatePosteDto } from './dto/update-poste.dto';

@Controller('postes')
export class PostesController {
  constructor(private readonly postesService: PostesService) {}

  @Post(':posteId/menus/:menuId')
  assignMenuToPoste(
    @Param('posteId') posteId: string,
    @Param('menuId') menuId: string,
  ): Promise<void> {
    return this.postesService.assignMenuToPoste(+posteId, +menuId);
  }

  @Delete(':posteId/menus/:menuId')
  removeMenuFromPoste(
    @Param('posteId') posteId: string,
    @Param('menuId') menuId: string,
  ): Promise<void> {
    return this.postesService.removeMenuFromPoste(+posteId, +menuId);
  }

  @Post()
  create(@Body() createPosteDto: CreatePosteDto) {
    return this.postesService.create(createPosteDto);
  }

  @Get()
  findAll() {
    return this.postesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePosteDto: UpdatePosteDto) {
    return this.postesService.update(+id, updatePosteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postesService.remove(+id);
  }
}
