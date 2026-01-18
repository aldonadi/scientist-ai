import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ExperimentService } from './experiment.service';

describe('ExperimentService', () => {
    let service: ExperimentService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ExperimentService]
        });
        service = TestBed.inject(ExperimentService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch experiments', () => {
        const dummyExperiments: any[] = [
            { _id: '1', status: 'RUNNING' },
            { _id: '2', status: 'COMPLETED' }
        ];

        service.getExperiments().subscribe(experiments => {
            expect(experiments.length).toBe(2);
            expect(experiments).toEqual(dummyExperiments);
        });

        const req = httpMock.expectOne('/api/experiments');
        expect(req.request.method).toBe('GET');
        req.flush(dummyExperiments);
    });

    it('should create an experiment', () => {
        const planId = 'plan123';
        const mockResponse = { _id: 'exp123', planId, status: 'INITIALIZING' };

        service.createExperiment(planId).subscribe(experiment => {
            expect(experiment._id).toBe('exp123');
            expect(experiment.status).toBe('INITIALIZING');
        });

        const req = httpMock.expectOne('/api/experiments');
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ planId });
        req.flush(mockResponse);
    });
});
