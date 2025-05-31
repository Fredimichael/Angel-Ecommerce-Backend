import { Test, TestingModule } from '@nestjs/testing';
import { CarouselService } from './carousel.service';

describe('CarouselService', () => {
  let service: CarouselService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarouselService],
    }).compile();

    service = module.get<CarouselService>(CarouselService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a carousel', async () => {
    const mockDto = { title: 'Test', subtitle: 'Test subtitle', link: 'http://example.com', accent: 'blue', image: 'http://example.com/image.jpg' };
    jest.spyOn(service, 'createCarousel').mockResolvedValue(mockDto);

    const result = await service.createCarousel(mockDto);
    expect(result).toEqual(mockDto);
    expect(service.createCarousel).toHaveBeenCalledWith(mockDto);
  });
});
