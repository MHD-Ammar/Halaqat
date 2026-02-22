/**
 * JWT Strategy
 *
 * Passport strategy for validating JWT tokens from Authorization header.
 * Supports both User (admin/teacher) and Student authentication.
 */

import { UserRole } from "@halaqat/types";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import { StudentsService } from "../../students/students.service";
import { UsersService } from "../../users/users.service";
import { JwtPayload } from "../interfaces/jwt-payload.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>("JWT_SECRET"),
    });
  }

  /**
   * Validate the JWT payload and return the user/student
   * This is called after the token signature is verified
   */
  async validate(payload: JwtPayload) {
    // Student authentication — fetch from students table
    if (payload.role === UserRole.STUDENT) {
      const student = await this.studentsService.findOne(payload.sub);

      if (!student) {
        throw new UnauthorizedException("Student not found");
      }

      return {
        id: student.id,
        studentId: student.id, // For student portal endpoints
        role: UserRole.STUDENT,
        name: student.name,
        mosqueId: student.mosqueId,
      };
    }

    // User authentication (admin/teacher/supervisor/examiner)
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      mosqueId: user.mosqueId,
    };
  }
}
