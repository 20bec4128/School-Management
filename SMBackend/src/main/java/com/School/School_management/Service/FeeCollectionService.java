package com.School.School_management.Service;

import com.School.School_management.Dto.FeeCollectionDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface FeeCollectionService {
    FeeCollectionDto createFeeCollection(FeeCollectionDto dto);
    List<FeeCollectionDto> getAllFeeCollections();
    List<FeeCollectionDto> getFeeCollectionsBySchool(Long schoolId);
    Page<FeeCollectionDto> getFeeCollectionsPage(Long schoolId, Long classId, Long feeTypeId, String status, String month, Boolean dueOnly, String search, int page, int size);
    FeeCollectionDto getFeeCollectionById(Long id);
    FeeCollectionDto updateFeeCollection(Long id, FeeCollectionDto dto);
    void deleteFeeCollection(Long id);
}
