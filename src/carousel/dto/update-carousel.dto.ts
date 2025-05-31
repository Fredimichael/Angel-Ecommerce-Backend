export class UpdateCarouselDto {
    image?: string;
    title: string;
    subtitle: string;
    link: string;
    accent: string;
    isOffer?: boolean;
    discount?: string | null;
}