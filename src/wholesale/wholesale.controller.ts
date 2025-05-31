import { Controller, Post, Body, Get, Param, Query, Delete } from '@nestjs/common';
import { WholesaleService } from './wholesale.service';
import { CreateWholesaleLinkDto } from './dto/create-wholesale-link.dto';
import { WholesaleCustomerDto } from './dto/wholesale-customer.dto';
import { GetLinksQueryDto } from './dto/get-links-query.dto';
import { ApplyPricingDto } from './dto/apply-pricing.dto';

@Controller('wholesale')
export class WholesaleController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Post('links')
  createLink(@Body() createLinkDto: CreateWholesaleLinkDto) {
    const processedDto = {
      ...createLinkDto,
      expiresAt: createLinkDto.expiresAt ? new Date(createLinkDto.expiresAt) : undefined
    };
    return this.wholesaleService.createLink(processedDto);
  }

  @Get('links/validate/:token')
  validateToken(@Param('token') token: string) {
    return this.wholesaleService.validateToken(token);
  }

  @Post('apply-pricing')
  async applyPricing(@Body() applyPricingDto: ApplyPricingDto) {
    return this.wholesaleService.applyWholesalePricing(
      applyPricingDto.products, 
      applyPricingDto.wholesaleToken
    );
  }

  @Post('save-customer')
  saveCustomer(@Body() customerDto: WholesaleCustomerDto) {
    return this.wholesaleService.saveCustomerData(customerDto);
  }

  @Get('customer/:token')
  getCustomer(@Param('token') token: string) {
    return this.wholesaleService.getCustomerData(token);
  }

  @Get('links')
  getAllLinks(@Query() query: GetLinksQueryDto) {
    return this.wholesaleService.getAllLinks({
      activeOnly: query.active === 'true',
      searchTerm: query.search?.trim()
    });
  }

  @Get('products/:token')
  async getWholesaleProducts(@Param('token') token: string) {
    return this.wholesaleService.getWholesaleProducts(token);
  }

  @Delete('links/:id')
  async deleteLink(@Param('id') id: string) {
    return this.wholesaleService.deleteLink(id);
  }
}