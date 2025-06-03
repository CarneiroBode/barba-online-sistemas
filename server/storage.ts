import { users, urlValidations, companies, type User, type InsertUser, type UrlValidation, type InsertUrlValidation, type Company } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUrlAccess(company_id: string, whatsapp: string, codigo: string): Promise<UrlValidation | undefined>;
  createUrlValidation(validation: InsertUrlValidation): Promise<UrlValidation>;
  markUrlValidationAsUsed(id: number): Promise<void>;
  getCompany(id: string): Promise<Company | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private urlValidations: Map<number, UrlValidation>;
  private companies: Map<string, Company>;
  private currentId: number;
  private currentUrlValidationId: number;

  constructor() {
    this.users = new Map();
    this.urlValidations = new Map();
    this.companies = new Map();
    this.currentId = 1;
    this.currentUrlValidationId = 1;

    // Add a default company for testing
    const defaultCompany: Company = {
      id: "1",
      name: "Empresa Padrão",
      active: true
    };
    this.companies.set("1", defaultCompany);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id, company_id: null };
    this.users.set(id, user);
    return user;
  }

  async validateUrlAccess(company_id: string, whatsapp: string, codigo: string): Promise<UrlValidation | undefined> {
    return Array.from(this.urlValidations.values()).find(
      (validation) => 
        validation.company_id === company_id && 
        validation.whatsapp === whatsapp && 
        validation.codigo === codigo &&
        !validation.used &&
        (!validation.expires_at || new Date(validation.expires_at) > new Date())
    );
  }

  async createUrlValidation(insertValidation: InsertUrlValidation): Promise<UrlValidation> {
    const id = this.currentUrlValidationId++;
    const validation: UrlValidation = {
      ...insertValidation,
      id,
      created_at: new Date(),
      used: false
    };
    this.urlValidations.set(id, validation);
    return validation;
  }

  async markUrlValidationAsUsed(id: number): Promise<void> {
    const validation = this.urlValidations.get(id);
    if (validation) {
      validation.used = true;
      this.urlValidations.set(id, validation);
    }
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }
}

export const storage = new MemStorage();