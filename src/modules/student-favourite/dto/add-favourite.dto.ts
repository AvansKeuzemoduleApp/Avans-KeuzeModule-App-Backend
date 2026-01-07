import { IsInt, IsPositive } from 'class-validator';

export class AddFavouriteDto {
    @IsInt({ message: 'Module ID must be an integer' })
    @IsPositive({ message: 'Module ID must be a positive integer' })
    moduleId!: number;
}
