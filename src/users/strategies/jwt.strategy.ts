// jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'tu-secreto-super-seguro',
    });
  }

// jwt.strategy.ts
  async validate(payload: any) {
    return { 
      id: payload.sub,       // <--- CAMBIA 'userId' POR 'id'
      username: payload.username,
      role: payload.role,
    };
  }
}