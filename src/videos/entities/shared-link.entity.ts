import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Video } from './video.entity';

@Entity()
export class SharedLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Video, (video) => video.id)
  video: Video;

  @Column()
  expiry: Date;
}
