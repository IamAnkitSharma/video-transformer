import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  sizeInBytes: number;

  @Column()
  durationInSeconds: number;

  @Column()
  url: string;

  @CreateDateColumn()
  createdAt: Date;
}
