import { Request, Response } from 'express';
import {
    getAprobadosPorClase,
    getReprobadosPorClase,
    getPorcentajeAprobados,
    getPorcentajeReprobados,
    getPorcentajeAprobadosDepartamento,
    getPorcentajeAprobadosDepartamentoActual,
    getPorcentajeReprobadosDepartamento,
    getPorcentajeReprobadosDepartamentoActual,
    getClaseConMasAprobado,
    getClaseConMasReprobado,
    getEstadisticasDepartment,
    getEstadisticasDepartmentUltimoPeriodo
} from '../../services/statistics/statisticsService';

export const handleGetAprobadosPorClase = async (req: Request, res: Response) => {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const result = await getAprobadosPorClase(sectionId);
        res.json({ cantidadAprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getEstadisticasDepartmentController = async (req: Request, res: Response) => {
    try {
        const statistics = await getEstadisticasDepartment(req);
        return res.status(200).json(statistics);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getEstadisticasDepartmentControllerActual = async (req: Request, res: Response) => {
    try {
        const statistics = await getEstadisticasDepartmentUltimoPeriodo(req);
        return res.status(200).json(statistics);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const handleGetReprobadosPorClase = async (req: Request, res: Response) => {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const result = await getReprobadosPorClase(sectionId);
        res.json({ cantidadReprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleGetPorcentajeAprobados = async (req: Request, res: Response) => {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const result = await getPorcentajeAprobados(sectionId);
        res.json({ porcentajeAprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleGetPorcentajeReprobados = async (req: Request, res: Response) => {
    try {
        const sectionId = parseInt(req.params.sectionId);
        const result = await getPorcentajeReprobados(sectionId);
        res.json({ porcentajeReprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleGetPorcentajeAprobadosDepartamento = async (req: Request, res: Response) => {
    try {
        const result = await getPorcentajeAprobadosDepartamento(req);
        res.json({ porcentajeAprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleGetPorcentajeAprobadosDepartamentoActual = async (req: Request, res: Response) => {
    try {
        const result = await getPorcentajeAprobadosDepartamentoActual(req);
        res.json({ porcentajeAprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleGetPorcentajeReprobadosDepartamento = async (req: Request, res: Response) => {
    try {
        const result = await getPorcentajeReprobadosDepartamento(req);
        res.json({ porcentajeReprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleGetPorcentajeReprobadosDepartamentoActual = async (req: Request, res: Response) => {
    try {
        const result = await getPorcentajeReprobadosDepartamentoActual(req);
        res.json({ porcentajeReprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleGetClaseConMasAprobado = async (req: Request, res: Response) => {
    try {
        const result = await getClaseConMasAprobado(req);
        res.json({ claseConMasAprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const handleGetClaseConMasReprobado = async (req: Request, res: Response) => {
    try {
        const result = await getClaseConMasReprobado(req);
        res.json({ claseConMasReprobados: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};