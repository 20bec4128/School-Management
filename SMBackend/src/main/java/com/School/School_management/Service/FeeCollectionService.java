package com.School.School_management.Service;

import com.School.School_management.Dto.FeeCollectionDto;
import java.util.List;

public interface FeeCollectionService {
    FeeCollectionDto createFeeCollection(FeeCollectionDto dto);
    List<FeeCollectionDto> getAllFeeCollections();
    List<FeeCollectionDto> getFeeCollectionsBySchool(Long schoolId);
    FeeCollectionDto getFeeCollectionById(Long id);
    FeeCollectionDto updateFeeCollection(Long id, FeeCollectionDto dto);
    void deleteFeeCollection(Long id);
}
